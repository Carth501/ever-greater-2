import { OperationId, ResourceType } from 'ever-greater-shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Database Functions', () => {
  let mockPool;
  let mockClient;
  let db;
  let consoleErrorSpy;
  let mockExecuteOperationForUser;

  class MockOperationValidationError extends Error {
    constructor(validation) {
      super(validation?.error || 'Invalid operation');
      this.name = 'OperationValidationError';
      this.validation = validation;
    }
  }

  beforeEach(async () => {
    // Clear all mocks
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Reset modules to reload db.js fresh
    vi.resetModules();

    // Create mock client
    mockClient = {
      query: vi.fn(),
      release: vi.fn(),
    };

    // Create mock pool
    mockPool = {
      connect: vi.fn().mockResolvedValue(mockClient),
      query: vi.fn(),
      end: vi.fn().mockResolvedValue(undefined),
      on: vi.fn(),
    };

    // Mock pg module with doMock (must be before dynamic import)
    vi.doMock('pg', () => ({
      Pool: vi.fn(function() {
        return mockPool;
      }),
    }));

    mockExecuteOperationForUser = vi.fn();
    vi.doMock('./operations/execution.js', () => ({
      executeOperationForUser: mockExecuteOperationForUser,
      OperationValidationError: MockOperationValidationError,
    }));

    // Dynamically import db.js fresh with the mocked pg
    db = await import('./db');
  });

  afterEach(() => {
    consoleErrorSpy?.mockRestore();
    vi.resetModules();
    vi.clearAllMocks();
  });

  describe('initializeDatabase', () => {
    it('should create tables and insert initial data', async () => {
      mockClient.query.mockImplementation(async (query) => {
        if (query.includes('SELECT id FROM schema_migrations')) {
          return { rows: [] };
        }

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
              { column_name: 'supplies_batch_level' },
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
        expect.stringContaining('CREATE TABLE IF NOT EXISTS schema_migrations')
      );
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS global_state')
      );
      const migrationInsertCalls = mockClient.query.mock.calls.filter((call) =>
        call[0].includes('INSERT INTO schema_migrations')
      );
      expect(migrationInsertCalls).toHaveLength(5);
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should skip inserting initial data if table is already populated', async () => {
      mockClient.query.mockImplementation(async (query) => {
        if (query.includes('SELECT id FROM schema_migrations')) {
          return { rows: [] };
        }

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
              { column_name: 'supplies_batch_level' },
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

    it('should convert credit_value column to NUMERIC to support decimal values', async () => {
      mockClient.query.mockImplementation(async (query) => {
        if (query.includes('SELECT id FROM schema_migrations')) {
          return { rows: [] };
        }

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
              { column_name: 'supplies_batch_level' },
            ],
          };
        }

        if (query.includes('SELECT COUNT(*) FROM global_state')) {
          return { rows: [{ count: 0 }] };
        }

        return { rows: [] };
      });

      await db.initializeDatabase();

      // Verify that ALTER TABLE is called to convert credit_value to NUMERIC
      const alterTableCalls = mockClient.query.mock.calls.filter((call) =>
        call[0].includes('ALTER COLUMN credit_value SET DATA TYPE NUMERIC')
      );

      expect(alterTableCalls.length).toBeGreaterThan(0);
      expect(alterTableCalls[0][0]).toContain('NUMERIC(10, 2)');
    });

    it('should skip migrations that are already recorded', async () => {
      mockClient.query.mockImplementation(async (query) => {
        if (query.includes('SELECT id FROM schema_migrations')) {
          return {
            rows: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }],
          };
        }

        if (query.includes('information_schema.columns')) {
          return {
            rows: [
              { column_name: 'tickets_contributed' },
              { column_name: 'printer_supplies' },
              { column_name: 'money' },
              { column_name: 'gold' },
              { column_name: 'autoprinters' },
              { column_name: 'credit_value' },
              { column_name: 'credit_generation_level' },
              { column_name: 'credit_capacity_level' },
              { column_name: 'supplies_batch_level' },
            ],
          };
        }

        if (query.includes('SELECT COUNT(*) FROM global_state')) {
          return { rows: [{ count: 1 }] };
        }

        return { rows: [] };
      });

      await db.initializeDatabase();

      expect(mockClient.query).not.toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS global_state')
      );
    });
  });

  describe('prepareDatabaseForRuntime', () => {
    it('should fail when migrations have not been applied', async () => {
      mockClient.query.mockImplementation(async (query) => {
        if (query.includes('information_schema.tables')) {
          return { rows: [{ exists: false }] };
        }

        throw new Error(`Unexpected query: ${query}`);
      });

      await expect(db.prepareDatabaseForRuntime()).rejects.toThrow(
        'Database migrations have not been applied'
      );
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should fail when migrations are still pending', async () => {
      mockClient.query.mockImplementation(async (query) => {
        if (query.includes('information_schema.tables')) {
          return { rows: [{ exists: true }] };
        }

        if (query.includes('SELECT id FROM schema_migrations')) {
          return { rows: [{ id: 1 }] };
        }

        throw new Error(`Unexpected query: ${query}`);
      });

      await expect(db.prepareDatabaseForRuntime()).rejects.toThrow(
        'Database has pending migrations'
      );
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should validate a ready database without rerunning migrations', async () => {
      mockClient.query.mockImplementation(async (query) => {
        if (query.includes('information_schema.tables')) {
          return { rows: [{ exists: true }] };
        }

        if (query.includes('SELECT id FROM schema_migrations')) {
          return {
            rows: [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }],
          };
        }

        if (query.includes("information_schema.columns WHERE table_name = 'users'")) {
          return {
            rows: [
              { column_name: 'tickets_contributed' },
              { column_name: 'printer_supplies' },
              { column_name: 'money' },
              { column_name: 'gold' },
              { column_name: 'autoprinters' },
              { column_name: 'credit_value' },
              { column_name: 'credit_generation_level' },
              { column_name: 'credit_capacity_level' },
              { column_name: 'supplies_batch_level' },
            ],
          };
        }

        if (query.includes('SELECT COUNT(*) FROM global_state')) {
          return { rows: [{ count: 1 }] };
        }

        return { rows: [] };
      });

      await db.prepareDatabaseForRuntime();

      expect(mockClient.query).not.toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS global_state')
      );
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
        expect.stringContaining('UPDATE global_state'),
        [1],
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
      const expectedStartingSupplies = db.STARTING_PRINTER_SUPPLIES;
      const mockUser = {
        id: 1,
        email: 'newuser@example.com',
        tickets_contributed: 0,
        printer_supplies: expectedStartingSupplies,
        money: 0,
        gold: 0,
        autoprinters: 0,
        milk: 0,
        credit_value: 0,
        credit_generation_level: 0,
        credit_capacity_level: 0,
        supplies_batch_level: 0,
        auto_buy_supplies_purchased: false,
        auto_buy_supplies_active: false,
      };

      mockPool.query.mockResolvedValue({ rows: [mockUser] });

      const user = await db.createUser('newuser@example.com', 'hashed_password');

      expect(user).toEqual(mockUser);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        [
          'newuser@example.com',
          'hashed_password',
          expectedStartingSupplies,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          false,
          false,
        ]
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
    it('should route periodic credit generation through the internal operation executor', async () => {
      mockClient.query.mockResolvedValue({
        rows: [
          {
            id: 1,
            email: 'one@example.com',
            tickets_contributed: 10,
            printer_supplies: 100,
            money: 0,
            gold: 0,
            autoprinters: 0,
            credit_value: 1,
            credit_generation_level: 2,
            credit_capacity_level: 5,
            supplies_batch_level: 0,
            auto_buy_supplies_purchased: false,
            auto_buy_supplies_active: false,
            tickets_withdrawn: 0,
          },
          {
            id: 2,
            email: 'two@example.com',
            tickets_contributed: 20,
            printer_supplies: 100,
            money: 0,
            gold: 0,
            autoprinters: 0,
            credit_value: 2,
            credit_generation_level: 3,
            credit_capacity_level: 5,
            supplies_batch_level: 0,
            auto_buy_supplies_purchased: false,
            auto_buy_supplies_active: false,
            tickets_withdrawn: 0,
          },
        ],
      });
      mockExecuteOperationForUser
        .mockResolvedValueOnce({ gain: { [ResourceType.CREDIT]: 0.2 } })
        .mockResolvedValueOnce({ gain: { [ResourceType.CREDIT]: 0.3 } });

      const result = await db.updateAllUsersCreditValues();

      expect(mockExecuteOperationForUser).toHaveBeenCalledTimes(2);
      expect(mockExecuteOperationForUser).toHaveBeenNthCalledWith(
        1,
        1,
        OperationId.GENERATE_CREDIT,
        undefined,
        expect.objectContaining({
          client: mockClient,
          globalTicketCount: 0,
          allowPrintAutoBuyFallback: false,
        }),
      );
      expect(result).toBe(2);
    });

    it('should return zero when no users are eligible for periodic credit generation', async () => {
      mockClient.query.mockResolvedValue({ rows: [] });

      const result = await db.updateAllUsersCreditValues();

      expect(mockExecuteOperationForUser).not.toHaveBeenCalled();
      expect(result).toBe(0);
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

  describe('executeResourceTransaction', () => {
    it('should throw GlobalTicketLimitExceeded before spending global tickets above personal limit', async () => {
      mockClient.query.mockImplementation(async (query) => {
        if (query === 'BEGIN') {
          return { rows: [] };
        }

        if (query.includes('SELECT tickets_contributed FROM users')) {
          return { rows: [{ tickets_contributed: 5 }] };
        }

        if (query.includes('SELECT COALESCE(SUM(amount), 0) as total FROM ticket_withdrawals')) {
          return { rows: [{ total: 4 }] };
        }

        if (query === 'ROLLBACK') {
          return { rows: [] };
        }

        throw new Error(`Unexpected query: ${query}`);
      });

      await expect(
        db.executeResourceTransaction(
          1,
          { [ResourceType.GLOBAL_TICKETS]: 2 },
          {},
        ),
      ).rejects.toMatchObject({ name: 'GlobalTicketLimitExceeded' });

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('spends global tickets and records the withdrawal when within the personal limit', async () => {
      let withdrawalRecorded = false;

      mockClient.query.mockImplementation(async (query) => {
        if (query === 'BEGIN' || query === 'COMMIT') {
          return { rows: [] };
        }

        if (query.includes('SELECT tickets_contributed FROM users')) {
          return { rows: [{ tickets_contributed: 10 }] };
        }

        if (query.includes('SELECT COALESCE(SUM(amount), 0) as total FROM ticket_withdrawals')) {
          return { rows: [{ total: withdrawalRecorded ? 3 : 1 }] };
        }

        if (query.includes('UPDATE global_state')) {
          return { rows: [{ count: 98 }] };
        }

        if (query.includes('UPDATE users')) {
          return {
            rows: [{
              id: 1,
              email: 'test@example.com',
              tickets_contributed: 10,
              printer_supplies: 100,
              money: 0,
              gold: 0,
              autoprinters: 0,
              credit_value: 0,
              credit_generation_level: 0,
              credit_capacity_level: 0,
              auto_buy_supplies_purchased: false,
              auto_buy_supplies_active: false,
            }],
          };
        }

        if (query.includes('INSERT INTO ticket_withdrawals')) {
          withdrawalRecorded = true;
          return { rows: [] };
        }

        throw new Error(`Unexpected query: ${query}`);
      });

      const user = await db.executeResourceTransaction(
        1,
        { [ResourceType.GLOBAL_TICKETS]: 2 },
        {},
      );

      expect(user.tickets_withdrawn).toBe(3);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO ticket_withdrawals'),
        [1, 2],
      );
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });
  });

  describe('processAutoprinters', () => {
    it('routes auto-buy refills and printing through the operation executor', async () => {
      mockClient.query.mockImplementation(async (query) => {
        if (query === 'BEGIN' || query === 'COMMIT') {
          return { rows: [] };
        }

        if (query.includes('FROM users WHERE autoprinters > 0')) {
          return {
            rows: [
              {
                id: 1,
                email: 'auto@example.com',
                tickets_contributed: 10,
                printer_supplies: 0,
                money: 0,
                gold: 2,
                autoprinters: 2,
                credit_value: 0,
                credit_generation_level: 0,
                credit_capacity_level: 0,
                supplies_batch_level: 0,
                auto_buy_supplies_purchased: true,
                auto_buy_supplies_active: true,
                tickets_withdrawn: 0,
              },
              {
                id: 2,
                email: 'printer@example.com',
                tickets_contributed: 20,
                printer_supplies: 3,
                money: 0,
                gold: 0,
                autoprinters: 3,
                credit_value: 0,
                credit_generation_level: 0,
                credit_capacity_level: 0,
                supplies_batch_level: 0,
                auto_buy_supplies_purchased: false,
                auto_buy_supplies_active: false,
                tickets_withdrawn: 0,
              },
            ],
          };
        }

        throw new Error(`Unexpected query: ${query}`);
      });

      mockExecuteOperationForUser
        .mockResolvedValueOnce({
          gain: { [ResourceType.PRINTER_SUPPLIES]: 200 },
          count: null,
          user: {
            id: 1,
            email: 'auto@example.com',
            tickets_contributed: 10,
            tickets_withdrawn: 0,
            printer_supplies: 200,
            money: 0,
            gold: 1,
            autoprinters: 2,
            credit_value: 0,
            credit_generation_level: 0,
            credit_capacity_level: 0,
            supplies_batch_level: 0,
            auto_buy_supplies_purchased: true,
            auto_buy_supplies_active: true,
          },
        })
        .mockResolvedValueOnce({
          gain: { [ResourceType.TICKETS_CONTRIBUTED]: 2 },
          count: 102,
          user: {},
        })
        .mockResolvedValueOnce({
          gain: { [ResourceType.TICKETS_CONTRIBUTED]: 3 },
          count: 105,
          user: {},
        });

      await expect(db.processAutoprinters()).resolves.toEqual({
        totalTickets: 5,
        newGlobalCount: 105,
      });
      expect(mockExecuteOperationForUser).toHaveBeenNthCalledWith(
        1,
        1,
        OperationId.BUY_SUPPLIES,
        undefined,
        expect.objectContaining({
          client: mockClient,
          globalTicketCount: 0,
          allowPrintAutoBuyFallback: false,
        }),
      );
      expect(mockExecuteOperationForUser).toHaveBeenNthCalledWith(
        2,
        1,
        OperationId.PRINT_TICKET,
        { quantity: 2 },
        expect.objectContaining({
          client: mockClient,
          globalTicketCount: 0,
          allowPrintAutoBuyFallback: false,
        }),
      );
      expect(mockExecuteOperationForUser).toHaveBeenNthCalledWith(
        3,
        2,
        OperationId.PRINT_TICKET,
        { quantity: 3 },
        expect.objectContaining({
          client: mockClient,
          globalTicketCount: 0,
          allowPrintAutoBuyFallback: false,
        }),
      );
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('rolls back autoprinter processing when the transaction fails', async () => {
      mockClient.query.mockImplementation(async (query) => {
        if (query === 'BEGIN') {
          return { rows: [] };
        }

        if (query.includes('FROM users WHERE autoprinters > 0')) {
          return {
            rows: [
              {
                id: 1,
                email: 'auto@example.com',
                tickets_contributed: 10,
                printer_supplies: 1,
                money: 0,
                gold: 0,
                autoprinters: 1,
                credit_value: 0,
                credit_generation_level: 0,
                credit_capacity_level: 0,
                supplies_batch_level: 0,
                auto_buy_supplies_purchased: false,
                auto_buy_supplies_active: false,
                tickets_withdrawn: 0,
              },
            ],
          };
        }

        if (query === 'ROLLBACK') {
          return { rows: [] };
        }

        throw new Error(`Unexpected query: ${query}`);
      });

      mockExecuteOperationForUser.mockRejectedValueOnce(
        new Error('Autoprinter failure'),
      );

      await expect(db.processAutoprinters()).rejects.toThrow('Autoprinter failure');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });
});
