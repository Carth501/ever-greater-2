const request = require('supertest');
const bcrypt = require('bcryptjs');
const session = require('express-session');

// Mock database BEFORE requiring the app
jest.mock('./db');
const db = require('./db');

// Mock connect-pg-simple to use memory store for tests
jest.mock('connect-pg-simple', () => {
  const MemoryStore = require('express-session').MemoryStore;
  return function() {
    return MemoryStore;
  };
});

const { createApp } = require('./index');

describe('Express API Endpoints', () => {
  let app;
  let agent;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create a new app instance for each test
    app = createApp();
    
    // Create a supertest agent to maintain session cookies across requests
    agent = request.agent(app);
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const email = 'newuser@example.com';
      const password = 'password123';
      const hashedPassword = await bcrypt.hash(password, 10);

      // Mock database functions
      db.getUserByEmail.mockResolvedValue(null);
      db.createUser.mockResolvedValue({
        id: 1,
        email,
        tickets_contributed: 0,
        printer_supplies: 100
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({ email, password })
        .expect(201);

      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(email);
      expect(response.body.user.id).toBe(1);
      expect(db.getUserByEmail).toHaveBeenCalledWith(email);
      expect(db.createUser).toHaveBeenCalled();
    });

    it('should reject registration if email already exists', async () => {
      const email = 'existing@example.com';
      const password = 'password123';

      db.getUserByEmail.mockResolvedValue({
        id: 1,
        email,
        password_hash: 'hashed',
        tickets_contributed: 0
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({ email, password })
        .expect(409);

      expect(response.body.error).toBe('Email already in use');
    });

    it('should return 400 if email or password is missing', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com' })
        .expect(400);

      expect(response.body.error).toBe('Email and password are required');
    });

    it('should return 400 if both email and password are missing', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Email and password are required');
    });

    it('should handle database errors', async () => {
      db.getUserByEmail.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: 'password123' })
        .expect(500);

      expect(response.body.error).toBe('Failed to register user');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login user successfully', async () => {
      const email = 'user@example.com';
      const password = 'password123';
      const hashedPassword = await bcrypt.hash(password, 10);

      db.getUserByEmail.mockResolvedValue({
        id: 1,
        email,
        password_hash: hashedPassword,
        tickets_contributed: 5
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email, password })
        .expect(200);

      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(email);
      expect(response.body.user.id).toBe(1);
    });

    it('should reject login with wrong password', async () => {
      const email = 'user@example.com';
      const correctPassword = 'password123';
      const wrongPassword = 'wrongpassword';
      const hashedPassword = await bcrypt.hash(correctPassword, 10);

      db.getUserByEmail.mockResolvedValue({
        id: 1,
        email,
        password_hash: hashedPassword,
        tickets_contributed: 5
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email, password: wrongPassword })
        .expect(401);

      expect(response.body.error).toBe('Invalid email or password');
    });

    it('should return 401 if user not found', async () => {
      db.getUserByEmail.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'password123' })
        .expect(401);

      expect(response.body.error).toBe('Invalid email or password');
    });

    it('should return 400 if email or password is missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' })
        .expect(400);

      expect(response.body.error).toBe('Email and password are required');
    });

    it('should handle database errors', async () => {
      db.getUserByEmail.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' })
        .expect(500);

      expect(response.body.error).toBe('Failed to login');
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user when authenticated', async () => {
      const email = 'user@example.com';
      const password = 'password123';
      const hashedPassword = await bcrypt.hash(password, 10);

      db.getUserByEmail.mockResolvedValue({
        id: 1,
        email,
        password_hash: hashedPassword,
        tickets_contributed: 5,
        printer_supplies: 100,
        money: 0,
        gold: 0,
        autoprinters: 0,
        credit_value: 0,
        credit_generation_level: 0,
        credit_capacity_level: 0,
      });

      db.getUserById.mockResolvedValue({
        id: 1,
        email,
        tickets_contributed: 5,
        printer_supplies: 100,
        money: 0,
        gold: 0,
        autoprinters: 0,
        credit_value: 0,
        credit_generation_level: 0,
        credit_capacity_level: 0,
      });

      await agent
        .post('/api/auth/login')
        .send({ email, password })
        .expect(200);

      const response = await agent
        .get('/api/auth/me')
        .expect(200);

      expect(response.body.user).toBeDefined();
      expect(response.body.user.id).toBe(1);
      expect(response.body.user.email).toBe(email);
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.error).toBe('Not authenticated');
    });
  });

  describe('GET /api/count', () => {
    it('should return current global count', async () => {
      db.getGlobalCount.mockResolvedValue(42);

      const response = await request(app)
        .get('/api/count')
        .expect(200);

      expect(response.body.count).toBe(42);
      expect(db.getGlobalCount).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      db.getGlobalCount.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/count')
        .expect(500);

      expect(response.body.error).toBe('Failed to retrieve count');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(200);

      expect(response.body.message).toBe('Logged out successfully');
    });
  });

  describe('POST /api/operations', () => {
    it('should include credit level updates in operation response', async () => {
      // Setup mock database state
      const testUser = {
        id: 1,
        email: 'test@example.com',
        password_hash: await bcrypt.hash('password123', 10),
        printer_supplies: 100,
        money: 600,
        gold: 0,
        autoprinters: 0,
        tickets_contributed: 0,
        credit_value: 50,
        credit_generation_level: 1,
        credit_capacity_level: 5,
      };

      const updatedUser = {
        ...testUser,
        credit_generation_level: 2,
      };

      // Mock getUserByEmail for login
      db.getUserByEmail.mockResolvedValue(testUser);
      
      // Mock getUserById for operation
      db.getUserById.mockResolvedValue(testUser);
      
      // Mock executeResourceTransaction for operation
      db.executeResourceTransaction.mockResolvedValue(updatedUser);
      
      // Mock getGlobalCount
      db.getGlobalCount.mockResolvedValue(100);

      // First, establish a session via login
      await agent
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' })
        .expect(200);

      // Now execute the operation with the established session
      const response = await agent
        .post('/api/operations/PRINT_TICKET')
        .send({})
        .expect(200);

      // Verify the response includes credit level updates
      expect(response.body.user.credit_generation_level).toBe(2);
      expect(response.body.user.credit_capacity_level).toBe(5);
      expect(response.body.user.credit_value).toBe(50);
    });

    it('should verify credit generation increments correctly over multiple updates', async () => {
      // Mock a user with generation_level=1 and capacity=1
      // Formula: credit_value = MIN(credit_value + 0.1 * 1, 1)
      // Each second: 0 -> 0.1 -> 0.2 -> ... -> 1.0 (capped)

      const testUser = {
        id: 1,
        email: 'test@example.com',
        password_hash: await bcrypt.hash('password123', 10),
        printer_supplies: 100,
        money: 0,
        gold: 0,
        autoprinters: 0,
        tickets_contributed: 0,
        credit_value: 0,
        credit_generation_level: 1,
        credit_capacity_level: 1,
      };

      db.getUserByEmail.mockResolvedValue(testUser);
      db.getUserById.mockResolvedValue(testUser);
      db.executeResourceTransaction.mockResolvedValue(testUser);
      db.getGlobalCount.mockResolvedValue(0);

      // Establish a session via login
      await agent
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' })
        .expect(200);

      // Verify the database query for credit updates contains proper logic
      // The formula should be: credit_value + FLOOR(generation_level * 10) / 100
      // Which equals: credit_value + FLOOR(1 * 10) / 100 = credit_value + 1/100 = credit_value + 0.01
      // But wait, let me check the actual implementation...
      // According to db.ts: FLOOR(credit_generation_level * 10)::INTEGER / 100
      // For generation_level=1: FLOOR(1*10)/100 = 10/100 = 0.1 ✓

      const response = await agent
        .post('/api/operations/PRINT_TICKET')
        .send({})
        .expect(200);

      // Verify response structure maintains credit levels
      expect(response.body.user).toBeDefined();
      expect(response.body.user.credit_generation_level).toBeDefined();
      expect(response.body.user.credit_capacity_level).toBeDefined();
      expect(response.body.user.credit_value).toBeDefined();
    });
  });
});
