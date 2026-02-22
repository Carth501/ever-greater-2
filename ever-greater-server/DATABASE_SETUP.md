# Database Setup Guide

This guide explains how to set up PostgreSQL for the ever-greater-server application.

## Prerequisites

You need PostgreSQL installed on your system. The application has been tested with PostgreSQL 12 and later.

### Installing PostgreSQL

**Windows:**

- Download the installer from [postgresql.org/download/windows](https://www.postgresql.org/download/windows/)
- Run the installer and follow the setup wizard
- Remember the password you set for the `postgres` superuser
- The default port is 5432

**macOS:**

- Using Homebrew: `brew install postgresql`
- Start PostgreSQL: `brew services start postgresql`

**Linux (Ubuntu/Debian):**

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

## Database Creation

### Option 1: Using psql Command Line

1. Open a terminal/command prompt
2. Connect to PostgreSQL as the postgres user:
   ```bash
   psql -U postgres
   ```
3. Create the database:
   ```sql
   CREATE DATABASE ever_greater_db;
   ```
4. Exit psql:
   ```sql
   \q
   ```

### Option 2: Using createdb Utility

```bash
createdb -U postgres ever_greater_db
```

### Option 3: Using pgAdmin

1. Open pgAdmin (installed with PostgreSQL)
2. Right-click on "Databases" → "Create" → "Database"
3. Enter database name: `ever_greater_db`
4. Click "Save"

## Environment Configuration

1. Navigate to the `ever-greater-server` directory

2. Copy the example environment file:

   ```bash
   cp .env.example .env
   ```

3. Edit the `.env` file and update the `DATABASE_URL` with your PostgreSQL credentials:

   ```
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/ever_greater_db
   ```

   Replace:
   - `postgres` with your PostgreSQL username (default is usually `postgres`)
   - `YOUR_PASSWORD` with your PostgreSQL password
   - `localhost` with your database host (use `localhost` for local development)
   - `5432` with your PostgreSQL port (default is `5432`)
   - `ever_greater_db` with your database name

### Connection String Format

The DATABASE_URL follows this format:

```
postgresql://[username]:[password]@[host]:[port]/[database]
```

## Automatic Table Creation

The application automatically creates the required `global_state` table on first startup. You don't need to run any SQL scripts manually.

When you start the server for the first time, you'll see:

```
Database initialized with count = 0
Database initialized successfully
ever-greater-server listening on http://localhost:4000
```

On subsequent starts, you'll see:

```
Database already initialized
Database initialized successfully
ever-greater-server listening on http://localhost:4000
```

## Verifying the Setup

### Using psql

1. Connect to your database:

   ```bash
   psql -U postgres -d ever_greater_db
   ```

2. View the table structure:

   ```sql
   \d global_state
   ```

3. Query the current count:

   ```sql
   SELECT * FROM global_state;
   ```

4. You should see:
   ```
    id | count |         updated_at
   ----+-------+----------------------------
     1 |     0 | 2026-02-22 10:30:45.123456
   ```

### Using pgAdmin

1. Open pgAdmin
2. Navigate to: Servers → PostgreSQL → Databases → ever_greater_db → Schemas → public → Tables
3. Right-click on `global_state` → "View/Edit Data" → "All Rows"

## Troubleshooting

### Connection Refused

**Error:** `Error: connect ECONNREFUSED 127.0.0.1:5432`

**Solution:** PostgreSQL is not running. Start the PostgreSQL service:

- **Windows:** Open Services, find PostgreSQL, and start it
- **macOS:** `brew services start postgresql`
- **Linux:** `sudo systemctl start postgresql`

### Authentication Failed

**Error:** `password authentication failed for user "postgres"`

**Solution:**

1. Double-check the password in your `.env` file
2. If you forgot the password, you may need to reset it using PostgreSQL's password recovery procedure

### Database Does Not Exist

**Error:** `database "ever_greater_db" does not exist`

**Solution:** Create the database following the "Database Creation" section above

### Permission Denied

**Error:** `permission denied to create database` or `permission denied for schema public`

**Solution:**

1. Ensure your PostgreSQL user has the necessary permissions
2. Connect as superuser and grant permissions:
   ```sql
   GRANT ALL PRIVILEGES ON DATABASE ever_greater_db TO your_username;
   ```

## Optional: Connection Pool Configuration

You can tune the connection pool settings in your `.env` file:

```
# Maximum number of connections in the pool (default: 10)
DB_POOL_MAX=20

# How long a client can remain idle before being closed (default: 30000ms)
DB_POOL_IDLE_TIMEOUT=60000
```

For this simple counter application, the default settings are typically sufficient.

## Database Schema

The `global_state` table has the following structure:

```sql
CREATE TABLE global_state (
    id INTEGER PRIMARY KEY,
    count INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

- **id**: Always set to 1 (single row for global state)
- **count**: The current global ticket count
- **updated_at**: Timestamp of last update (automatically updated on increment)

## Backup and Restore

### Backup

To backup your database:

```bash
pg_dump -U postgres ever_greater_db > backup.sql
```

### Restore

To restore from backup:

```bash
psql -U postgres ever_greater_db < backup.sql
```

## Production Considerations

For production deployments:

1. **Use strong passwords** - Don't use default or simple passwords
2. **Use environment variables** - Never commit `.env` to version control
3. **Enable SSL/TLS** - Add `?sslmode=require` to your DATABASE_URL
4. **Monitor connections** - Adjust pool size based on load
5. **Regular backups** - Set up automated database backups
6. **Use managed database** - Consider using services like AWS RDS, Google Cloud SQL, or Heroku Postgres

## Support

If you encounter issues not covered in this guide, please check:

- PostgreSQL official documentation: [postgresql.org/docs](https://www.postgresql.org/docs/)
- The `pg` library documentation: [node-postgres.com](https://node-postgres.com/)
