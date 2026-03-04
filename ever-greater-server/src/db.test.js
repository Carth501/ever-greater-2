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
      mockClient.query.mockImplementation(async (query) => {
        if (query.includes('information_schema.columns')) {
          return {
            rows: [
              { column_name: 'tickets_contributed' },
              { column_name: 'printer_supplies' },
              { column_name: 'money' },
              { column_name: 'gold' },
              { column_name: 'autoprinters' },
              { column_name: 'milk' },
              { column_name: 'credit_value' },
              { column_name: 'credit_generation_level' },
              { column_name: 'credit_capacity_level' },
            ],
          };
        }

        if (query.includes('SELECT COUNT(*) FROM global_state')) {
          return { rows: [{ count: 0 }] };
        }

        return { rows: [] };
      });

      await db.initializeDatabase();

      // Should have called query multiple times
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS global_state')
      );
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should skip inserting initial data if table is already populated', async () => {
      mockClient.query.mockImplementation(async (query) => {
        if (query.includes('information_schema.columns')) {
          return {
            rows: [
              { column_name: 'tickets_contributed' },
              { column_name: 'printer_supplies' },
              { column_name: 'money' },
              { column_name: 'gold' },
              { column_name: 'autoprinters' },
              { column_name: 'milk' },
              { column_name: 'credit_value' },
              { column_name: 'credit_generation_level' },
              { column_name: 'credit_capacity_level' },
            ],
          };
        }

        if (query.includes('SELECT COUNT(*) FROM global_state')) {
          return { rows: [{ count: 1 }] };
        }

        return { rows: [] };
      });

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
        printer_supplies: 100,
        money: 0,
        gold: 0,
        autoprinters: 0,
        milk: 0,
        credit_value: 0,
        credit_generation_level: 0,
        credit_capacity_level: 0,
      };

      mockPool.query.mockResolvedValue({ rows: [mockUser] });

      const user = await db.createUser('newuser@example.com', 'hashed_password');

      expect(user).toEqual(mockUser);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        ['newuser@example.com', 'hashed_password', 100, 0, 0, 0, 0, 0, 0]
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

  describe('updateAllUsersCreditValues', () => {
    it('should increment credit values based on generation level and capacity', async () => {
      // Mock the SQL query for credit updates
      mockClient.query.mockResolvedValue({ rows: [], rowCount: 5 });

      const result = await db.updateAllUsersCreditValues();

      // Verify the query was called
      expect(mockClient.query).toHaveBeenCalled();
      
      // Check that the SQL query contains the credit update logic
      const queryCall = mockClient.query.mock.calls[0][0];
      expect(queryCall).toContain('UPDATE users');
      expect(queryCall).toContain('credit_value');
      expect(queryCall).toContain('credit_generation_level');
      expect(queryCall).toContain('credit_capacity_level');
      
      // Verify the formula: LEAST(credit_value + 0.1 * generation_level, credit_capacity_level)
      expect(queryCall).toContain('LEAST');
      
      // Verify return value
      expect(result).toBe(5);
    });

    it('should handle errors during credit update', async () => {
      mockClient.query.mockRejectedValue(new Error('Database error'));

      await expect(db.updateAllUsersCreditValues()).rejects.toThrow('Database error');
    });

    it('should release client after credit update', async () => {
      mockClient.query.mockResolvedValue({ rows: [], rowCount: 0 });

      await db.updateAllUsersCreditValues();

      expect(mockClient.release).toHaveBeenCalled();
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
