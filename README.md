# Ever Greater

A full-stack application with a React client and Express WebSocket server for managing a global ticket pool with PostgreSQL persistence.

## Project Structure

- **ever-greater-client** - React TypeScript frontend
- **ever-greater-server** - Node.js Express + WebSocket backend
- **ever-greater-shared** - Shared types and utilities

## Local Development

- **Node.js** - 20 or later (the repo prefers Node 20 via `.nvmrc`, and CI runs on Node 20)
- **PostgreSQL** - 12 or later

From the repository root, run `npm run dev` to start the Vite client and the server watch process together.

---

## Client Setup

### Available Scripts

In the client directory (`ever-greater-client`), you can run:

#### `npm start`

Runs the app in development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

#### `npm test`

Runs the Vitest test runner in watch mode.

#### `npm run build`

Builds the app for production to the `build` folder.\
It uses Vite to bundle the application for production and optimize the output.

The build is minified and the filenames include hashes.\
Your app is ready to be deployed!

#### Internal Preview Mode

The client includes a stable internal preview entry for dashboard concept work:

- `http://localhost:3000/#internal/preview/dashboard`
- `http://localhost:3000/#internal/preview/dashboard?controls=0`

The hash-based entry avoids depending on server-side SPA routing and keeps the preview usable in local development and static preview environments.

The older query-based entry (`?concept=dashboard`) still works for compatibility, but the hash route is the preferred permanent internal path.

## Server Setup

### Prerequisites

- **Node.js** (20 or later; 20.x preferred)
- **PostgreSQL** (v12 or later) - [Installation Guide](ever-greater-server/DATABASE_SETUP.md#installing-postgresql)

### Configuration

1. **Install Dependencies**

   ```bash
   cd ever-greater-server
   npm install
   ```

2. **Configure Database**

   Install and start PostgreSQL (see [DATABASE_SETUP.md](ever-greater-server/DATABASE_SETUP.md) for detailed instructions)

   Create a database for the application:

   ```bash
   createdb -U postgres ever_greater_db
   ```

3. **Configure Environment Variables**

   Copy the example environment file:

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and update the database settings for your machine:

   ```
   DATABASE_URL=postgresql://postgres:your_password@localhost:5432/ever_greater_db
   SESSION_SECRET=local-dev-session-secret
   STARTING_PRINTER_SUPPLIES=1000
   ```

   `SESSION_SECRET` can be any non-empty value for local development. It is required in production.

   **Important:** Never commit the `.env` file to version control. It's already included in `.gitignore`.

4. **Start the Server**

   ```bash
   npm run dev
   ```

   Use `npm start` when you want a production-style build and run.

   The server will automatically create the necessary database tables on first startup.

### Environment Variables

| Variable                    | Description                            | Default                                                                                   | Required                                    |
| --------------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------- |
| `DATABASE_URL`              | PostgreSQL connection string           | -                                                                                         | Yes                                         |
| `PORT`                      | Server port                            | `4000`                                                                                    | No                                          |
| `CLIENT_URL`                | Allowed CORS origins (comma-separated) | `http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173` | No                                          |
| `DB_POOL_MAX`               | Maximum database connections           | `10`                                                                                      | No                                          |
| `DB_POOL_IDLE_TIMEOUT`      | Connection idle timeout (ms)           | `30000`                                                                                   | No                                          |
| `SESSION_SECRET`            | Session cookie signing secret          | Local fallback only; set explicitly for stable environments                               | Local-only optional, required in production |
| `STARTING_PRINTER_SUPPLIES` | Starting supplies for users            | `1000`                                                                                    | No                                          |

### Server Scripts

- `npm start` - run the server
- `npm run dev` - run the server in watch mode with TypeScript entrypoint reloads

### API Endpoints

- `GET /api/count` - returns the current global ticket pool count
- `POST /api/operations/:operationId` - executes a game operation (e.g., `PRINT_TICKET`, `BUY_SUPPLIES`)
- WebSocket `ws://localhost:4000/ws` - pushes `{ "count": number }` updates and user-specific updates

### Database

The application uses PostgreSQL to persist the global ticket count. The count survives server restarts.

For detailed database setup instructions, troubleshooting, and schema information, see [ever-greater-server/DATABASE_SETUP.md](ever-greater-server/DATABASE_SETUP.md).

### Architecture

- **Express.js** - HTTP server for REST endpoints
- **WebSocket (ws)** - Real-time count updates to connected clients
- **PostgreSQL (pg)** - Persistent storage with connection pooling
- **dotenv** - Environment variable management

The database uses a single-row table design with atomic UPDATE operations to prevent race conditions during concurrent increments.

---

## TODO

- [x] Ticket contribution limiting withdrawls
- [ ] Create a threshold system to not show the player everything up-front
- [x] Don't disable the buttons when updating or waiting for an update. Queue changes, and send them in batches. If a change is processed and fails, do the rest.
- [ ] The client should simulate the changes made, but still treat the server as authoritative on server update.
- [x] When an update comes from the server, don't just instantly update the number. Randomly interpolate the value. Buttons should still toggle disabled state immediately.
- [x] Resolve the deprecated dependency messages
- [ ] Create a development/debug menu.
- [ ] Create a operation batch system for better server performance.

---

## Learn More

- [React documentation](https://reactjs.org/)
- [Vite documentation](https://vite.dev/guide/)
