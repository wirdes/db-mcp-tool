export type DatabaseType = 'postgres' | 'mysql' | 'firestore';

export interface DatabaseConnectionConfig {
    // PostgreSQL ve MySQL için
    host?: string;
    port?: number;
    database?: string;
    user?: string;
    password?: string;
    // Firestore için
    projectId?: string;
    keyFilename?: string;
}

export interface DatabaseConfig {
    type: DatabaseType;
    connection: DatabaseConnectionConfig;
}

export interface TableInfo {
    name: string;
    columns: ColumnInfo[];
}

export interface ColumnInfo {
    name: string;
    type: string;
    nullable: boolean;
}

export interface TriggerInfo {
    name: string;
    table: string;
    event: string;
    timing: string;
    statement: string;
}

export interface FunctionInfo {
    name: string;
    language: string;
    returnType: string;
    arguments: string;
    definition: string;
} 