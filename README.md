# Database Explorer MCP Tool

[![smithery badge](https://smithery.ai/badge/@wirdes/db-mcp-tool)](https://smithery.ai/server/@wirdes/db-mcp-tool)

A powerful Model Context Protocol (MCP) tool for exploring and managing different types of databases including PostgreSQL, MySQL, and Firestore.

## Features

- **Multiple Database Support**

  - PostgreSQL
  - MySQL
  - Firestore

- **Database Operations**
  - Connect to databases
  - List tables
  - View triggers
  - List functions
  - Execute SQL queries (PostgreSQL and MySQL)
  - Export table schemas
  - Export table data

## Integration with Cursor

Before adding the tool to Cursor, you need to build the project:

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the project:
   ```bash
   npm run build
   ```

To add the tool to Cursor:

1. Open Cursor settings
2. Navigate to "Model Context Protocol (MCP)" section
3. Click "Add New Tool"
4. Fill in the following details:
   ```json
   {
     "name": "database-explorer",
     "command": "node /path/to/project/dist/index.js",
     "description": "Database Explorer MCP Tool"
   }
   ```
   Note: Replace `/path/to/project` with the actual path to your project directory.
5. Save the settings
6. Restart Cursor

Using the Tool:

1. After setup, you can connect to your database using one of these commands:

   - For PostgreSQL: Use `!pg` with connection details
   - For MySQL: Use `!mysql` with connection details
   - For Firestore: Use `!firestore` with connection details

2. Once connected, you can use various database operations:
   - `!tables` to list all tables
   - `!triggers` to view triggers
   - `!functions` to list functions
   - `!query` to execute SQL queries
   - `!export-db` to export table schemas
   - `!export-data` to export table data

See the Commands section below for detailed usage examples.

## Commands

### Connection Commands

- `!pg` - Connect to PostgreSQL database

  ```json
  {
    "connection": {
      "host": "hostname",
      "port": 5432,
      "database": "dbname",
      "user": "username",
      "password": "password"
    }
  }
  ```

- `!mysql` - Connect to MySQL database

  ```json
  {
    "connection": {
      "host": "hostname",
      "port": 3306,
      "database": "dbname",
      "user": "username",
      "password": "password"
    }
  }
  ```

- `!firestore` - Connect to Firestore database
  ```json
  {
    "connection": {
      "projectId": "your-project-id",
      "keyFilename": "path/to/keyfile.json"
    }
  }
  ```

### Database Operation Commands

- `!tables` - List all tables in the connected database
- `!triggers` - List all triggers in the connected database
- `!functions` - List all functions in the connected database
- `!query` - Execute SQL query (PostgreSQL and MySQL only)
  ```json
  {
    "query": "SELECT * FROM table_name"
  }
  ```
- `!export-db` - Export table schema
  ```json
  {
    "table": "table_name"
  }
  ```
- `!export-data` - Export table data as INSERT statements
  ```json
  {
    "table": "table_name"
  }
  ```

## Requirements

- Node.js
- Required database drivers:
  - `pg` for PostgreSQL
  - `mysql2` for MySQL
  - `@google-cloud/firestore` for Firestore

## Usage

1. Make sure you have the necessary database credentials
2. Connect to your database using the appropriate connection command
3. Use the available commands to explore and manage your database

## Error Handling

- The tool includes comprehensive error handling for:
  - Connection failures
  - Query execution errors
  - Schema and data export issues
  - Invalid database operations

## Notes

- Firestore support is limited to basic operations due to its NoSQL nature
- SQL operations are only available for PostgreSQL and MySQL
