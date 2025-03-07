import pg from 'pg';
import mysql from 'mysql2/promise';
import { Firestore } from '@google-cloud/firestore';
import { DatabaseConfig, TableInfo, TriggerInfo, FunctionInfo } from '../types/database.js';

export class DatabaseService {
    private postgresClient?: pg.Client;
    private mysqlConnection?: any;
    private firestoreClient?: Firestore;
    private config: DatabaseConfig;

    constructor(config: DatabaseConfig) {
        this.config = config;
    }

    async connect(): Promise<void> {
        switch (this.config.type) {
            case 'postgres': {
                const config = this.config.connection as any;
                this.postgresClient = new pg.Client(config);
                await this.postgresClient.connect();
                break;
            }
            case 'mysql': {
                const config = this.config.connection as any;
                this.mysqlConnection = await mysql.createConnection(config);
                break;
            }
            case 'firestore': {
                const config = this.config.connection as any;
                this.firestoreClient = new Firestore(config);
                break;
            }
        }
    }

    async getTables(): Promise<TableInfo[]> {
        switch (this.config.type) {
            case 'postgres': {
                const query = `
          SELECT 
            table_name,
            json_agg(json_build_object(
              'name', column_name,
              'type', data_type,
              'nullable', is_nullable = 'YES'
            )) as columns
          FROM information_schema.columns
          WHERE table_schema = 'public'
          GROUP BY table_name;
        `;
                const result = await this.postgresClient!.query(query);
                return result.rows.map(row => ({
                    name: row.table_name,
                    columns: row.columns
                }));
            }
            case 'mysql': {
                const [rows] = await this.mysqlConnection!.query(`
          SELECT 
            TABLE_NAME as tableName,
            GROUP_CONCAT(
              JSON_OBJECT(
                'name', COLUMN_NAME,
                'type', DATA_TYPE,
                'nullable', IS_NULLABLE = 'YES'
              )
            ) as columns
          FROM information_schema.columns
          WHERE table_schema = DATABASE()
          GROUP BY TABLE_NAME;
        `);
                return rows.map((row: any) => ({
                    name: row.tableName,
                    columns: JSON.parse(`[${row.columns}]`)
                }));
            }
            case 'firestore': {
                // Firestore'da tablo yapısı olmadığı için koleksiyonları listeleyeceğiz
                const collections = await this.firestoreClient!.listCollections();
                return collections.map(collection => ({
                    name: collection.id,
                    columns: [] // Firestore şemasız olduğu için boş bırakıyoruz
                }));
            }
            default:
                return [];
        }
    }

    async getTriggers(): Promise<TriggerInfo[]> {
        switch (this.config.type) {
            case 'postgres': {
                const query = `
                    SELECT 
                        trigger_name as name,
                        event_object_table as table,
                        event_manipulation as event,
                        action_timing as timing,
                        action_statement as statement
                    FROM information_schema.triggers
                    WHERE trigger_schema = 'public';
                `;
                const result = await this.postgresClient!.query(query);
                return result.rows;
            }
            case 'mysql': {
                const [rows] = await this.mysqlConnection!.query(`
                    SELECT 
                        TRIGGER_NAME as name,
                        EVENT_OBJECT_TABLE as \`table\`,
                        EVENT_MANIPULATION as event,
                        ACTION_TIMING as timing,
                        ACTION_STATEMENT as statement
                    FROM information_schema.TRIGGERS
                    WHERE TRIGGER_SCHEMA = DATABASE();
                `);
                return rows;
            }
            case 'firestore': {
                // Firestore does not support triggers at database level
                return [];
            }
            default:
                return [];
        }
    }

    async getFunctions(): Promise<FunctionInfo[]> {
        switch (this.config.type) {
            case 'postgres': {
                const query = `
                    SELECT 
                        p.proname as name,
                        l.lanname as language,
                        pg_get_function_result(p.oid) as "returnType",
                        pg_get_function_arguments(p.oid) as arguments,
                        pg_get_functiondef(p.oid) as definition
                    FROM pg_proc p
                    JOIN pg_namespace n ON p.pronamespace = n.oid
                    JOIN pg_language l ON p.prolang = l.oid
                    WHERE n.nspname = 'public';
                `;
                const result = await this.postgresClient!.query(query);
                return result.rows;
            }
            case 'mysql': {
                const [rows] = await this.mysqlConnection!.query(`
                    SELECT 
                        ROUTINE_NAME as name,
                        'SQL' as language,
                        DTD_IDENTIFIER as returnType,
                        CONCAT_WS(', ', 
                            GROUP_CONCAT(
                                CONCAT(PARAMETER_NAME, ' ', DATA_TYPE)
                                ORDER BY ORDINAL_POSITION
                            )
                        ) as arguments,
                        ROUTINE_DEFINITION as definition
                    FROM information_schema.ROUTINES r
                    LEFT JOIN information_schema.PARAMETERS p
                        ON r.SPECIFIC_NAME = p.SPECIFIC_NAME
                    WHERE r.ROUTINE_SCHEMA = DATABASE()
                        AND r.ROUTINE_TYPE = 'FUNCTION'
                    GROUP BY r.SPECIFIC_NAME;
                `);
                return rows;
            }
            case 'firestore': {
                // Firestore does not support stored functions
                return [];
            }
            default:
                return [];
        }
    }

    async executeQuery(query: string): Promise<any> {
        switch (this.config.type) {
            case 'postgres': {
                if (!this.postgresClient) {
                    throw new Error('PostgreSQL connection not found');
                }
                const result = await this.postgresClient.query(query);
                return result.rows;
            }
            case 'mysql': {
                if (!this.mysqlConnection) {
                    throw new Error('MySQL connection not found');
                }
                const [rows] = await this.mysqlConnection.query(query);
                return rows;
            }
            case 'firestore': {
                throw new Error('SQL queries are not supported for Firestore');
            }
            default:
                throw new Error('Unsupported database type');
        }
    }

    async disconnect(): Promise<void> {
        switch (this.config.type) {
            case 'postgres':
                await this.postgresClient?.end();
                break;
            case 'mysql':
                await this.mysqlConnection?.end();
                break;
            // Firestore için özel bir disconnect işlemi gerekmiyor
        }
    }

    async exportTableSchema(tableName: string): Promise<string> {
        switch (this.config.type) {
            case 'postgres': {
                if (!this.postgresClient) {
                    throw new Error('PostgreSQL connection not found');
                }
                const query = `
                    SELECT 
                        'CREATE TABLE ' || quote_ident($1) || ' (' ||
                        string_agg(
                            quote_ident(column_name) || ' ' ||
                            data_type ||
                            CASE 
                                WHEN character_maximum_length IS NOT NULL 
                                THEN '(' || character_maximum_length || ')'
                                ELSE ''
                            END ||
                            CASE 
                                WHEN is_nullable = 'NO' 
                                THEN ' NOT NULL'
                                ELSE ''
                            END,
                            ', '
                        ) || ');' as create_table_sql
                    FROM information_schema.columns
                    WHERE table_name = $1 AND table_schema = 'public'
                    GROUP BY table_name;
                `;
                const result = await this.postgresClient.query(query, [tableName]);
                return result.rows[0]?.create_table_sql || '';
            }
            case 'mysql': {
                if (!this.mysqlConnection) {
                    throw new Error('MySQL connection not found');
                }
                const [result] = await this.mysqlConnection.query(
                    'SHOW CREATE TABLE ??',
                    [tableName]
                );
                return result[0]?.['Create Table'] || '';
            }
            case 'firestore': {
                throw new Error('SQL schema export is not supported for Firestore');
            }
            default:
                throw new Error('Unsupported database type');
        }
    }

    async exportTableData(tableName: string): Promise<string> {
        switch (this.config.type) {
            case 'postgres': {
                if (!this.postgresClient) {
                    throw new Error('PostgreSQL connection not found');
                }

                // Önce tablo verilerini al
                const dataQuery = `SELECT * FROM ${tableName};`;
                const result = await this.postgresClient.query(dataQuery);

                if (result.rows.length === 0) {
                    return '';
                }

                // Sütun isimlerini al
                const columns = Object.keys(result.rows[0]);

                // INSERT ifadelerini oluştur
                const insertStatements = result.rows.map(row => {
                    const values = columns.map(col => {
                        const val = row[col];
                        if (val === null) return 'NULL';
                        if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
                        return val;
                    });
                    return `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});`;
                });

                return insertStatements.join('\n');
            }
            case 'mysql': {
                if (!this.mysqlConnection) {
                    throw new Error('MySQL connection not found');
                }

                // Önce tablo verilerini al
                const [rows] = await this.mysqlConnection.query(
                    'SELECT * FROM ??',
                    [tableName]
                );

                if (rows.length === 0) {
                    return '';
                }

                // Sütun isimlerini al
                const columns = Object.keys(rows[0]);

                // INSERT ifadelerini oluştur
                const insertStatements = rows.map((row: any) => {
                    const values = columns.map(col => {
                        const val = row[col];
                        if (val === null) return 'NULL';
                        if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
                        return val;
                    });
                    return `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});`;
                });

                return insertStatements.join('\n');
            }
            case 'firestore': {
                throw new Error('SQL data export is not supported for Firestore');
            }
            default:
                throw new Error('Unsupported database type');
        }
    }
} 