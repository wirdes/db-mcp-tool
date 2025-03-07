#!/usr/bin/env node

import {
  McpServer,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { DatabaseService } from "./services/database.js";
import { DatabaseConfig, DatabaseConnectionConfig, DatabaseType } from "./types/database.js";

// Create an MCP server
const server = new McpServer({
  name: "database-explorer",
  version: "1.0.0",
  description: "Database Explorer MCP Tool",
});

// Initialize database service as null
let dbService: DatabaseService | null = null;

// Define connection schemas for each database type
const postgresConnectionSchema = {
  connection: z.object({
    host: z.string(),
    port: z.number().optional(),
    database: z.string(),
    user: z.string(),
    password: z.string(),
  }),
};

const mysqlConnectionSchema = {
  connection: z.object({
    host: z.string(),
    port: z.number().optional(),
    database: z.string(),
    user: z.string(),
    password: z.string(),
  }),
};

const firestoreConnectionSchema = {
  connection: z.object({
    projectId: z.string(),
    keyFilename: z.string(),
  }),
};

// Add PostgreSQL connection tool
server.tool(
  "!pg",
  postgresConnectionSchema,
  async (args: { connection: DatabaseConnectionConfig }) => {
    try {
      const config: DatabaseConfig = {
        type: 'postgres',
        connection: args.connection
      };
      dbService = new DatabaseService(config);
      await dbService.connect();
      return {
        content: [{ type: "text", text: "Successfully connected to PostgreSQL database!" }],
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        content: [{ type: "text", text: `PostgreSQL connection error: ${errorMessage}` }],
        isError: true,
      };
    }
  }
);

// Add MySQL connection tool
server.tool(
  "!mysql",
  mysqlConnectionSchema,
  async (args: { connection: DatabaseConnectionConfig }) => {
    try {
      const config: DatabaseConfig = {
        type: 'mysql',
        connection: args.connection
      };
      dbService = new DatabaseService(config);
      await dbService.connect();
      return {
        content: [{ type: "text", text: "Successfully connected to MySQL database!" }],
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        content: [{ type: "text", text: `MySQL connection error: ${errorMessage}` }],
        isError: true,
      };
    }
  }
);

// Add Firestore connection tool
server.tool(
  "!firestore",
  firestoreConnectionSchema,
  async (args: { connection: DatabaseConnectionConfig }) => {
    try {
      const config: DatabaseConfig = {
        type: 'firestore',
        connection: args.connection
      };
      dbService = new DatabaseService(config);
      await dbService.connect();
      return {
        content: [{ type: "text", text: "Successfully connected to Firestore database!" }],
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        content: [{ type: "text", text: `Firestore connection error: ${errorMessage}` }],
        isError: true,
      };
    }
  }
);

// Add get tables tool
server.tool(
  "!tables",
  {},
  async () => {
    if (!dbService) {
      return {
        content: [{ type: "text", text: "You must connect to a database first!" }],
        isError: true,
      };
    }

    try {
      const tables = await dbService.getTables();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(tables, null, 2),
          },
        ],
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        content: [{ type: "text", text: `Failed to get table information: ${errorMessage}` }],
        isError: true,
      };
    }
  }
);

// Add get triggers tool
server.tool(
  "!triggers",
  {},
  async () => {
    if (!dbService) {
      return {
        content: [{ type: "text", text: "You must connect to a database first!" }],
        isError: true,
      };
    }

    try {
      const triggers = await dbService.getTriggers();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(triggers, null, 2),
          },
        ],
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        content: [{ type: "text", text: `Failed to get trigger information: ${errorMessage}` }],
        isError: true,
      };
    }
  }
);

// Add get functions tool
server.tool(
  "!functions",
  {},
  async () => {
    if (!dbService) {
      return {
        content: [{ type: "text", text: "You must connect to a database first!" }],
        isError: true,
      };
    }

    try {
      const functions = await dbService.getFunctions();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(functions, null, 2),
          },
        ],
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        content: [{ type: "text", text: `Failed to get function information: ${errorMessage}` }],
        isError: true,
      };
    }
  }
);

// Add query execution tool
server.tool(
  "!query",
  {
    query: z.string(),
  },
  async (args: { query: string }) => {
    if (!dbService) {
      return {
        content: [{ type: "text", text: "You must connect to a database first!" }],
        isError: true,
      };
    }

    try {
      const results = await dbService.executeQuery(args.query);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(results, null, 2),
          },
        ],
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        content: [{ type: "text", text: `Failed to execute query: ${errorMessage}` }],
        isError: true,
      };
    }
  }
);

// Add export schema tool
server.tool(
  "!export-db",
  {
    table: z.string(),
  },
  async (args: { table: string }) => {
    if (!dbService) {
      return {
        content: [{ type: "text", text: "You must connect to a database first!" }],
        isError: true,
      };
    }

    try {
      const schema = await dbService.exportTableSchema(args.table);
      return {
        content: [
          {
            type: "text",
            text: schema,
          },
        ],
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        content: [{ type: "text", text: `Failed to export table schema: ${errorMessage}` }],
        isError: true,
      };
    }
  }
);

// Add export data tool
server.tool(
  "!export-data",
  {
    table: z.string(),
  },
  async (args: { table: string }) => {
    if (!dbService) {
      return {
        content: [{ type: "text", text: "You must connect to a database first!" }],
        isError: true,
      };
    }

    try {
      const data = await dbService.exportTableData(args.table);
      return {
        content: [
          {
            type: "text",
            text: data,
          },
        ],
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        content: [{ type: "text", text: `Failed to export table data: ${errorMessage}` }],
        isError: true,
      };
    }
  }
);

// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();

// Handle errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Connect the server
await server.connect(transport);
