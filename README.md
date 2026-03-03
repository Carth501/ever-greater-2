# Ever Greater

A full-stack application with a React client and Express WebSocket server for managing a global ticket pool with PostgreSQL persistence.

## Project Structure

- **ever-greater-client** - React TypeScript frontend
- **ever-greater-server** - Node.js Express + WebSocket backend
- **ever-greater-shared** - Shared types and utilities

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

Launches the test runner in interactive watch mode.\
See the [Create React App testing documentation](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

#### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include hashes.\
Your app is ready to be deployed!

#### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and transitive dependencies (webpack, Babel, ESLint, etc) into your project so you have full control over them.

## Server Setup

### Prerequisites

- **Node.js** (v18 or later)
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

   Edit `.env` and update the `DATABASE_URL` with your PostgreSQL credentials:

   ```
   DATABASE_URL=postgresql://postgres:your_password@localhost:5432/ever_greater_db
   ```

   **Important:** Never commit the `.env` file to version control. It's already included in `.gitignore`.

4. **Start the Server**

   ```bash
   npm start
   ```

   The server will automatically create the necessary database tables on first startup.

### Environment Variables

| Variable               | Description                  | Default | Required |
| ---------------------- | ---------------------------- | ------- | -------- |
| `DATABASE_URL`         | PostgreSQL connection string | -       | Yes      |
| `PORT`                 | Server port                  | `4000`  | No       |
| `DB_POOL_MAX`          | Maximum database connections | `10`    | No       |
| `DB_POOL_IDLE_TIMEOUT` | Connection idle timeout (ms) | `30000` | No       |

### Server Scripts

- `npm start` - run the server
- `npm run dev` - run the server in development mode

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
- [ ] Don't disable the buttons when updating or waiting for an update. Queue changes, and send them in batches. If a change is processed and fails, do the rest.
- [ ] The client should simulate the changes made, but still treat the server as authoritative on server update.
- [ ] When an update comes from the server, don't just instantly update the number. Randomly interpolate the value. Buttons should still toggle disabled state immediately.
- [x] Resolve the deprecated dependency messages

---

## Learn More

- [React documentation](https://reactjs.org/)
- [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started)
