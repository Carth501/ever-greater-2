describe('Database Functions', () => {
  let mockPool;
  let mockClient;
  let db;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Reset modules to reload db.js fresh
    jest.resetModules();

    // Create mock client
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };

    // Create mock pool
    mockPool = {
      connect: jest.fn().mockResolvedValue(mockClient),
      query: jest.fn(),
      end: jest.fn().mockResolvedValue(undefined),
      on: jest.fn(),
    };

    // Mock pg module with doMock (must be before require)
    jest.doMock('pg', () => ({
      Pool: jest.fn(() => mockPool),
    }));

    // Now require db.js fresh with the mocked pg
    db = require('./db');
  });

  afterEach(() => {
    jest.resetModules();
  });

  describe('initializeDatabase', () => {
    it('should create tables and insert initial data', async () => {
      mockClient.query.mockResolvedValue({ rows: [{ count: 0 }] });

      await db.initializeDatabase();

      // Should have called query multiple times
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS global_state')
      );
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should skip inserting initial data if table is already populated', async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // CREATE TABLE global_state
        .mockResolvedValueOnce({ rows: [] }) // CREATE TABLE users
        .mockResolvedValueOnce({ rows: [] }) // CREATE TABLE session
        .mockResolvedValueOnce({ rows: [] }) // CREATE INDEX
        .mockResolvedValueOnce({ rows: [{ count: 1 }] }); // SELECT COUNT - table not empty

      await db.initializeDatabase();

      expect(mockClient.query).toHaveBeenCalled();
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should release the client even if an error occurs', async () => {
      mockClient.query.mockRejectedValue(new Error('Database error'));

      await expect(db.initializeDatabase()).rejects.toThrow('Database error');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('getGlobalCount', () => {
    it('should return the current global count', async () => {
      mockPool.query.mockResolvedValue({ rows: [{ count: 42 }] });

      const count = await db.getGlobalCount();

      expect(count).toBe(42);
      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT count FROM global_state WHERE id = 1'
      );
    });

    it('should handle database errors', async () => {
      const error = new Error('Connection failed');
      mockPool.query.mockRejectedValue(error);

      await expect(db.getGlobalCount()).rejects.toThrow('Connection failed');
    });
  });

  describe('incrementGlobalCount', () => {
    it('should increment count and return new value', async () => {
      mockPool.query.mockResolvedValue({ rows: [{ count: 43 }] });

      const newCount = await db.incrementGlobalCount();

      expect(newCount).toBe(43);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE global_state')
      );
    });

    it('should handle database errors', async () => {
      mockPool.query.mockRejectedValue(new Error('Update failed'));

      await expect(db.incrementGlobalCount()).rejects.toThrow('Update failed');
    });

    it('should increment from any starting value', async () => {
      mockPool.query.mockResolvedValue({ rows: [{ count: 100 }] });

      const newCount = await db.incrementGlobalCount();

      expect(newCount).toBe(100);
    });
  });

  describe('getUserByEmail', () => {
    it('should return user object when found', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password_hash: 'hashed_password',
        tickets_contributed: 5,
        created_at: '2024-01-01',
      };

      mockPool.query.mockResolvedValue({ rows: [mockUser] });

      const user = await db.getUserByEmail('test@example.com');

      expect(user).toEqual(mockUser);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, email, password_hash'),
        ['test@example.com']
      );
    });

    it('should return null when user not found', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const user = await db.getUserByEmail('nonexistent@example.com');

      expect(user).toBeNull();
    });

    it('should handle database errors', async () => {
      mockPool.query.mockRejectedValue(new Error('Query failed'));

      await expect(db.getUserByEmail('test@example.com')).rejects.toThrow(
        'Query failed'
      );
    });
  });

  describe('createUser', () => {
    it('should create a new user and return user object', async () => {
      const mockUser = {
        id: 1,
        email: 'newuser@example.com',
        tickets_contributed: 0,
        created_at: '2024-01-01',
      };

      mockPool.query.mockResolvedValue({ rows: [mockUser] });

      const user = await db.createUser('newuser@example.com', 'hashed_password');

      expect(user).toEqual(mockUser);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        ['newuser@example.com', 'hashed_password']
      );
    });

    it('should handle database errors', async () => {
      mockPool.query.mockRejectedValue(
        new Error('Duplicate email error')
      );

      await expect(db.createUser('duplicate@example.com', 'hashed_password')).rejects.toThrow(
        'Duplicate email error'
      );
    });
  });

  describe('updateUserTickets', () => {
    it('should update user tickets by increment amount', async () => {
      mockPool.query.mockResolvedValue({ rows: [{ tickets_contributed: 10 }] });

      const updatedTickets = await db.updateUserTickets(1, 5);

      expect(updatedTickets).toBe(10);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE users SET tickets_contributed'),
        [5, 1]
      );
    });

    it('should handle negative increments', async () => {
      mockPool.query.mockResolvedValue({ rows: [{ tickets_contributed: 4 }] });

      const updatedTickets = await db.updateUserTickets(1, -1);

      expect(updatedTickets).toBe(4);
    });

    it('should handle database errors', async () => {
      mockPool.query.mockRejectedValue(new Error('Update failed'));

      await expect(db.updateUserTickets(1, 5)).rejects.toThrow('Update failed');
    });
  });

  describe('getUserById', () => {
    it('should return user object when found', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        tickets_contributed: 5,
        created_at: '2024-01-01',
      };

      mockPool.query.mockResolvedValue({ rows: [mockUser] });

      const user = await db.getUserById(1);

      expect(user).toEqual(mockUser);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT id, email, tickets_contributed'),
        [1]
      );
    });

    it('should return null when user not found', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });

      const user = await db.getUserById(999);

      expect(user).toBeNull();
    });

    it('should handle database errors', async () => {
      mockPool.query.mockRejectedValue(new Error('Query failed'));

      await expect(db.getUserById(1)).rejects.toThrow('Query failed');
    });
  });

  describe('closePool', () => {
    it('should call pool.end() to close connections', async () => {
      await db.closePool();

      expect(mockPool.end).toHaveBeenCalled();
    });

    it('should handle errors during pool close', async () => {
      mockPool.end.mockRejectedValue(new Error('Close failed'));

      await expect(db.closePool()).rejects.toThrow('Close failed');
    });
  });
});
