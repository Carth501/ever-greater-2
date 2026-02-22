# ever-greater-server

Simple Express + WebSocket server for the global ticket pool with PostgreSQL persistence.

## Prerequisites

- **Node.js** (v18 or later)
- **PostgreSQL** (v12 or later) - [Installation Guide](DATABASE_SETUP.md#installing-postgresql)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Database

1. Install and start PostgreSQL (see [DATABASE_SETUP.md](DATABASE_SETUP.md) for detailed instructions)
2. Create a database for the application:
   ```bash
   createdb -U postgres ever_greater_db
   ```

### 3. Configure Environment Variables

1. Copy the example environment file:

   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and update the `DATABASE_URL` with your PostgreSQL credentials:
   ```
   DATABASE_URL=postgresql://postgres:your_password@localhost:5432/ever_greater_db
   ```

**Important:** Never commit the `.env` file to version control. It's already included in `.gitignore`.

### 4. Start the Server

```bash
npm start
```

The server will automatically create the necessary database tables on first startup.

## Environment Variables

| Variable               | Description                  | Default | Required |
| ---------------------- | ---------------------------- | ------- | -------- |
| `DATABASE_URL`         | PostgreSQL connection string | -       | Yes      |
| `PORT`                 | Server port                  | `4000`  | No       |
| `DB_POOL_MAX`          | Maximum database connections | `10`    | No       |
| `DB_POOL_IDLE_TIMEOUT` | Connection idle timeout (ms) | `30000` | No       |

## Scripts

- `npm start` - run the server
- `npm run dev` - run the server

## Endpoints

- `GET /api/count` - returns the current global ticket pool count
- `POST /api/increment` - increments the count by 1 and returns the new count
- WebSocket `ws://localhost:4000/ws` - pushes `{ "count": number }` updates

## Database

The application uses PostgreSQL to persist the global ticket count. The count survives server restarts.

For detailed database setup instructions, troubleshooting, and schema information, see [DATABASE_SETUP.md](DATABASE_SETUP.md).

## Architecture

- **Express.js** - HTTP server for REST endpoints
- **WebSocket (ws)** - Real-time count updates to connected clients
- **PostgreSQL (pg)** - Persistent storage with connection pooling
- **dotenv** - Environment variable management

The database uses a single-row table design with atomic UPDATE operations to prevent race conditions during concurrent increments.
