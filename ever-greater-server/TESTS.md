# Server Unit Tests

Comprehensive unit tests for the Ever-Greater server, using Jest testing framework.

## Test Coverage

### Database Tests (`src/db.test.js`)

Tests for all database functions with mocked PostgreSQL pool:

- **`initializeDatabase`** - Database schema initialization
  - Creates tables and indexes
  - Inserts initial data when empty
  - Skips insertion if table is already populated
  - Properly releases client connections on errors

- **`getGlobalCount`** - Retrieve current global count
  - Returns count successfully
  - Handles database errors

- **`incrementGlobalCount`** - Atomically increment global count
  - Increments count and returns new value
  - Handles errors
  - Works from any starting value

- **`getUserByEmail`** - Find user by email
  - Returns user object when found
  - Returns null when not found
  - Handles database errors

- **`createUser`** - Create new user
  - Creates and returns new user object
  - Handles duplicate email errors

- **`updateUserTickets`** - Update user's ticket contribution
  - Increments tickets by specified amount
  - Handles negative increments
  - Handles errors

- **`getUserById`** - Find user by ID
  - Returns user when found
  - Returns null when not found
  - Handles errors

- **`closePool`** - Close database connection pool
  - Closes pool successfully
  - Handles close errors

### API Endpoint Tests (`src/index.test.js`)

Tests for Express endpoints with mocked database functions:

- **POST `/api/auth/register`** - User registration
  - Registers new user successfully
  - Rejects duplicate emails
  - Validates required fields
  - Handles database errors

- **POST `/api/auth/login`** - User login
  - Logs in user with correct credentials
  - Rejects wrong passwords
  - Returns 401 for non-existent users
  - Validates required fields
  - Handles errors

- **GET `/api/auth/me`** - Get current user
  - Returns current user when authenticated
  - Returns 401 when not authenticated

- **POST `/api/auth/logout`** - User logout
  - Logs out successfully

- **GET `/api/count`** - Get global count
  - Returns current global count
  - Handles database errors

- **POST `/api/increment`** - Increment count
  - Returns 401 when not authenticated
  - Increments count when authenticated

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test:watch

# Generate coverage report
npm test:coverage

# Run specific test file
npm test -- src/db.test.js
npm test -- src/index.test.js
```

## Test Setup

- **Framework**: Jest
- **HTTP Testing**: Supertest (for Express endpoints)
- **Mocking**: Jest's built-in mocking utilities
- **Environment**: Node.js test environment

All external dependencies (PostgreSQL pool, bcryptjs, etc.) are mocked to ensure tests run independently without requiring a database connection.
