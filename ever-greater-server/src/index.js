require('dotenv').config();
const http = require("http");
const express = require("express");
const cors = require("cors");
const { WebSocketServer, WebSocket } = require("ws");
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const bcrypt = require("bcryptjs");
const { 
  initializeDatabase, 
  getGlobalCount, 
  incrementGlobalCount, 
  closePool,
  pool,
  getUserByEmail,
  createUser,
  updateUserTickets,
  getUserById,
  decrementUserSupplies,
  incrementUserMoney,
  buySupplies,
  buyGold,
  buyAutoprinter,
  processAutoprinters
} = require('./db');

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

let wss; // WebSocket server instance
let server; // HTTP server instance
let autoprinterInterval; // Autoprinter timer interval
const socketUserMap = new Map(); // Map of socket -> userId

function broadcastCount(count) {
  if (!wss) return;
  const payload = JSON.stringify({ count });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

/**
 * Send user-specific updates (supplies, money, contributions) to a specific user's WebSocket
 * @param {number} userId - User ID
 * @param {object} updates - Object with optional: supplies, money, tickets_contributed
 */
async function sendUserUpdate(userId, updates) {
  if (!wss) return;
  
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && socketUserMap.get(client) === userId) {
      const payload = JSON.stringify({ user_update: updates });
      client.send(payload);
    }
  });
}

/**
 * Broadcast autoprinter updates to all users
 * Gets the latest user data for each connected user and sends their updates
 */
async function broadcastAutoprinterUpdates() {
  if (!wss) return;
  
  // Create a set of unique userIds from connected sockets
  const userIds = new Set();
  socketUserMap.forEach((userId) => {
    userIds.add(userId);
  });

  // Get updated data for each user and send to their socket(s)
  for (const userId of userIds) {
    try {
      const user = await getUserById(userId);
      if (user) {
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN && socketUserMap.get(client) === userId) {
            const payload = JSON.stringify({
              user_update: {
                supplies: user.printer_supplies,
                money: user.money,
                tickets_contributed: user.tickets_contributed
              }
            });
            client.send(payload);
          }
        });
      }
    } catch (error) {
      console.error(`Error sending autoprinter update to user ${userId}:`, error);
    }
  }
}

function createApp() {
  const app = express();

  app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true
  }));
  app.use(express.json());

  // Session configuration
  app.use(
    session({
      store: new pgSession({
        pool: pool,
        tableName: 'session'
      }),
      secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
      }
    })
  );

  // ============ AUTH ENDPOINTS ============

  /**
   * Register a new user
   * POST /api/auth/register
   * Body: { email: string, password: string }
   */
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // Check if user already exists
      const existingUser = await getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: 'Email already in use' });
      }

      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Create user
      const user = await createUser(email, passwordHash);

      // Set session
      req.session.userId = user.id;

      res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          tickets_contributed: user.tickets_contributed,
          printer_supplies: user.printer_supplies,
          money: user.money,
          gold: user.gold,
          autoprinters: user.autoprinters || 0
        }
      });
    } catch (error) {
      console.error('Error registering user:', error);
      res.status(500).json({ error: 'Failed to register user' });
    }
  });

  /**
   * Login user
   * POST /api/auth/login
   * Body: { email: string, password: string }
   */
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // Find user
      const user = await getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Compare password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Set session
      req.session.userId = user.id;

      res.json({
        user: {
          id: user.id,
          email: user.email,
          tickets_contributed: user.tickets_contributed,
          printer_supplies: user.printer_supplies,
          money: user.money,
          gold: user.gold,
          autoprinters: user.autoprinters || 0,
          autoprinters: user.autoprinters || 0
        }
      });
    } catch (error) {
      console.error('Error logging in user:', error);
      res.status(500).json({ error: 'Failed to login' });
    }
  });

  /**
   * Get current user
   * GET /api/auth/me
   * Requires active session
   */
  app.get("/api/auth/me", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const user = await getUserById(req.session.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        user: {
          id: user.id,
          email: user.email,
          tickets_contributed: user.tickets_contributed,
          printer_supplies: user.printer_supplies,
          money: user.money,
          gold: user.gold,
          autoprinters: user.autoprinters || 0
        }
      });
    } catch (error) {
      console.error('Error fetching current user:', error);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  });

  /**
   * Logout user
   * POST /api/auth/logout
   */
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
        return res.status(500).json({ error: 'Failed to logout' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });

  // ============ GLOBAL COUNT ENDPOINTS ============

  app.get("/api/count", async (req, res) => {
    try {
      const count = await getGlobalCount();
      res.json({ count });
    } catch (error) {
      console.error('Error getting count:', error);
      res.status(500).json({ error: 'Failed to retrieve count' });
    }
  });

  app.post("/api/increment", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Check and decrement user's printer supplies
      let newSupplies;
      try {
        newSupplies = await decrementUserSupplies(req.session.userId);
      } catch (error) {
        if (error.message === 'Out of supplies') {
          return res.status(403).json({ error: 'Out of supplies' });
        }
        throw error; // Re-throw other errors
      }

      // Increment global count
      const newCount = await incrementGlobalCount();
      
      // Update user's ticket contribution
      await updateUserTickets(req.session.userId, 1);

      // Increment user's money
      const newMoney = await incrementUserMoney(req.session.userId, 1);

      broadcastCount(newCount);
      
      // Send user-specific updates via WebSocket
      await sendUserUpdate(req.session.userId, {
        supplies: newSupplies,
        money: newMoney,
        tickets_contributed: 1 // This is incrementing by 1
      });
      
      res.json({ count: newCount, supplies: newSupplies, money: newMoney });
    } catch (error) {
      console.error('Error incrementing count:', error);
      res.status(500).json({ error: 'Failed to increment count' });
    }
  });

  // ============ SHOP ENDPOINTS ============

  /**
   * Buy supplies with money
   * POST /api/shop/buy-supplies
   * Body: { amount: number } (optional, defaults to 1)
   */
  app.post("/api/shop/buy-supplies", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const moneyCost = 10;
      const suppliesGain = 100;

      // Try to buy supplies (deduct money and add supplies atomically)
      let result;
      try {
        result = await buySupplies(req.session.userId, moneyCost, suppliesGain);
      } catch (error) {
        if (error.message === 'Insufficient money') {
          return res.status(403).json({ error: 'Insufficient money' });
        }
        throw error; // Re-throw other errors
      }

      // Send user-specific updates via WebSocket
      await sendUserUpdate(req.session.userId, {
        money: result.money,
        supplies: result.printer_supplies
      });

      res.json({
        money: result.money,
        printer_supplies: result.printer_supplies
      });
    } catch (error) {
      console.error('Error buying supplies:', error);
      res.status(500).json({ error: 'Failed to buy supplies' });
    }
  });

  /**
   * Buy gold with money
   * POST /api/shop/buy-gold
   * Body: { quantity: number }
   */
  app.post("/api/shop/buy-gold", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { quantity } = req.body;

      // Validate quantity
      if (!quantity || typeof quantity !== 'number' || quantity < 1 || !Number.isInteger(quantity)) {
        return res.status(400).json({ error: 'Invalid quantity. Must be a positive integer.' });
      }

      const goldCostPerUnit = 100;
      const moneyCost = quantity * goldCostPerUnit;

      // Try to buy gold (deduct money and add gold atomically)
      let result;
      try {
        result = await buyGold(req.session.userId, moneyCost, quantity);
      } catch (error) {
        if (error.message === 'Insufficient money') {
          return res.status(403).json({ error: 'Insufficient money' });
        }
        throw error; // Re-throw other errors
      }

      // Send user-specific updates via WebSocket
      await sendUserUpdate(req.session.userId, {
        money: result.money,
        gold: result.gold
      });

      res.json({
        money: result.money,
        gold: result.gold
      });
    } catch (error) {
      console.error('Error buying gold:', error);
      res.status(500).json({ error: 'Failed to buy gold' });
    }
  });

  /**
   * Buy an autoprinter with gold
   * POST /api/shop/buy-autoprinter
   * Cost: 3 * (current_autoprinters + 1)^2 gold
   */
  app.post("/api/shop/buy-autoprinter", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.session.userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      // Try to buy autoprinter (deduct gold and add autoprinter atomically)
      let result;
      try {
        result = await buyAutoprinter(req.session.userId);
      } catch (error) {
        if (error.message === 'Insufficient gold') {
          return res.status(403).json({ error: 'Insufficient gold' });
        }
        throw error; // Re-throw other errors
      }

      // Send user-specific updates via WebSocket
      await sendUserUpdate(req.session.userId, {
        gold: result.gold,
        autoprinters: result.autoprinters
      });

      res.json({
        gold: result.gold,
        autoprinters: result.autoprinters
      });
    } catch (error) {
      console.error('Error buying autoprinter:', error);
      res.status(500).json({ error: 'Failed to buy autoprinter' });
    }
  });

  return app;
}

function createServer(app) {
  const server = http.createServer(app);
  wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", async (socket) => {
    try {
      const count = await getGlobalCount();
      socket.send(JSON.stringify({ count }));
    } catch (error) {
      console.error('Error sending initial count to WebSocket client:', error);
    }

    // Handle incoming messages (authentication)
    socket.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        // Handle authentication message with userId
        if (message.type === "authenticate" && message.userId) {
          const userId = parseInt(message.userId, 10);
          if (!isNaN(userId)) {
            socketUserMap.set(socket, userId);
            socket.send(JSON.stringify({ authenticated: true }));
          }
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });

    // Clean up on socket close
    socket.on("close", () => {
      socketUserMap.delete(socket);
    });
  });

  return server;
}

// Initialize database and start server (only if this is the main module)
if (require.main === module) {
  (async () => {
    try {
      await initializeDatabase();
      console.log('Database initialized successfully');
      
      const app = createApp();
      server = createServer(app);
      
      server.listen(PORT, () => {
        console.log(`ever-greater-server listening on http://localhost:${PORT}`);
      });

      // Start autoprinter processor (runs every 4 seconds)
      autoprinterInterval = setInterval(async () => {
        try {
          const result = await processAutoprinters();
          if (result.totalTickets > 0) {
            broadcastCount(result.newGlobalCount);
            // Also broadcast user-specific updates to all connected users
            await broadcastAutoprinterUpdates();
          }
        } catch (error) {
          console.error('Error processing autoprinters:', error);
        }
      }, 4000);
      console.log('Autoprinter processor started (4 second interval)');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      process.exit(1);
    }
  })();

  // Graceful shutdown handlers
  const shutdown = async (signal) => {
    console.log(`\n${signal} received, shutting down gracefully...`);

    // Clear autoprinter interval
    if (autoprinterInterval) {
      clearInterval(autoprinterInterval);
      console.log('Autoprinter processor stopped');
    }

    // Close HTTP server first to stop accepting new connections
    if (server) {
      server.close(() => {
        console.log('HTTP server closed');

        // Then close WebSocket server
        if (wss) {
          wss.close(() => {
            console.log('WebSocket server closed');

            // Finally close database pool
            closePool().then(() => {
              console.log('Database pool closed');
              process.exit(0);
            });
          });
        } else {
          // No WebSocket server, just close pool
          closePool().then(() => {
            console.log('Database pool closed');
            process.exit(0);
          });
        }
      });
    } else {
      // No HTTP server, close remaining resources
      if (wss) {
        wss.close(() => {
          console.log('WebSocket server closed');
          closePool().then(() => {
            console.log('Database pool closed');
            process.exit(0);
          });
        });
      } else {
        await closePool();
        console.log('Database pool closed');
        process.exit(0);
      }
    }
    
    // Force shutdown after 10 seconds
    setTimeout(() => {
      console.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

// Export for testing
module.exports = { createApp, createServer };
