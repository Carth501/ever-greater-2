import bcrypt from "bcryptjs";
import connectPgSimple from "connect-pg-simple";
import cors from "cors";
import "dotenv/config";
import {
  OperationId,
  operations,
  ResourceType,
  validateOperation,
} from "ever-greater-shared";
import express, { type Express } from "express";
import session from "express-session";
import http, { type Server } from "http";
import { fileURLToPath } from "url";
import { WebSocket, WebSocketServer, type RawData } from "ws";
import {
  cleanupOldTicketWithdrawals,
  closePool,
  createUser,
  executeResourceTransaction,
  getGlobalCount,
  getUserByEmail,
  getUserById,
  incrementGlobalCount,
  initializeDatabase,
  pool,
  processAutoprinters,
  updateAllUsersCreditValues,
} from "./db.js";

declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

const __filename = fileURLToPath(import.meta.url);
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

let wss: WebSocketServer | undefined;
let server: Server | undefined;
let autoprinterInterval: NodeJS.Timeout | undefined;
let creditUpdateInterval: NodeJS.Timeout | undefined;
let ticketCleanupInterval: NodeJS.Timeout | undefined;
const socketUserMap = new Map<WebSocket, number>();

const PgSession = connectPgSimple(session);

type UserUpdatePayload = Partial<{
  supplies: number;
  money: number;
  gold: number;
  autoprinters: number;
  tickets_contributed: number;
  tickets_withdrawn: number;
  credit_value: number;
  credit_generation_level: number;
  credit_capacity_level: number;
}>;

interface IncomingSocketMessage {
  type?: string;
  userId?: string | number;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

function broadcastCount(count: number): void {
  if (!wss) return;
  const payload = JSON.stringify({ count });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

async function sendUserUpdate(
  userId: number,
  updates: UserUpdatePayload,
): Promise<void> {
  if (!wss) return;

  wss.clients.forEach((client) => {
    if (
      client.readyState === WebSocket.OPEN &&
      socketUserMap.get(client) === userId
    ) {
      const payload = JSON.stringify({ user_update: updates });
      client.send(payload);
    }
  });
}

async function broadcastAutoprinterUpdates(): Promise<void> {
  if (!wss) return;

  const userIds = new Set<number>();
  socketUserMap.forEach((userId) => {
    userIds.add(userId);
  });

  for (const userId of userIds) {
    try {
      const user = await getUserById(userId);
      if (user) {
        wss.clients.forEach((client) => {
          if (
            client.readyState === WebSocket.OPEN &&
            socketUserMap.get(client) === userId
          ) {
            const payload = JSON.stringify({
              user_update: {
                supplies: user.printer_supplies,
                money: user.money,
                tickets_contributed: user.tickets_contributed,
                tickets_withdrawn: user.tickets_withdrawn,
              },
            });
            client.send(payload);
          }
        });
      }
    } catch (error) {
      console.error(
        `Error sending autoprinter update to user ${userId}:`,
        error,
      );
    }
  }
}

async function broadcastCreditUpdates(): Promise<void> {
  if (!wss) return;

  const userIds = new Set<number>();
  socketUserMap.forEach((userId) => {
    userIds.add(userId);
  });

  for (const userId of userIds) {
    try {
      const user = await getUserById(userId);
      if (user) {
        wss.clients.forEach((client) => {
          if (
            client.readyState === WebSocket.OPEN &&
            socketUserMap.get(client) === userId
          ) {
            const payload = JSON.stringify({
              user_update: {
                credit_value: user.credit_value,
              },
            });
            client.send(payload);
          }
        });
      }
    } catch (error) {
      console.error(`Error sending credit update to user ${userId}:`, error);
    }
  }
}

function createApp(): Express {
  const app = express();

  app.use(
    cors({
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      credentials: true,
    }),
  );
  app.use(express.json());

  // Use MemoryStore for testing, PgSession for production
  const isTestEnvironment =
    process.env.NODE_ENV === "test" || process.env.VITEST === "true";
  const sessionStore = isTestEnvironment
    ? undefined // Uses default MemoryStore
    : new PgSession({
        pool,
        tableName: "session",
      });

  app.use(
    session({
      store: sessionStore,
      secret:
        process.env.SESSION_SECRET || "your-secret-key-change-in-production",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000,
      },
    }),
  );

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password } = req.body as {
        email?: string;
        password?: string;
      };

      if (!email || !password) {
        return res
          .status(400)
          .json({ error: "Email and password are required" });
      }

      const existingUser = await getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: "Email already in use" });
      }

      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      const user = await createUser(email, passwordHash);

      req.session.userId = user.id;

      return res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          tickets_contributed: user.tickets_contributed,
          printer_supplies: user.printer_supplies,
          money: user.money,
          gold: user.gold,
          autoprinters: user.autoprinters || 0,
          credit_value: user.credit_value || 0,
          credit_generation_level: user.credit_generation_level || 0,
          credit_capacity_level: user.credit_capacity_level || 0,
        },
      });
    } catch (error) {
      console.error("Error registering user:", error);
      return res.status(500).json({ error: "Failed to register user" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body as {
        email?: string;
        password?: string;
      };

      if (!email || !password) {
        return res
          .status(400)
          .json({ error: "Email and password are required" });
      }

      const user = await getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const isValidPassword = await bcrypt.compare(
        password,
        user.password_hash,
      );
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      req.session.userId = user.id;

      return res.json({
        user: {
          id: user.id,
          email: user.email,
          tickets_contributed: user.tickets_contributed,
          printer_supplies: user.printer_supplies,
          money: user.money,
          gold: user.gold,
          autoprinters: user.autoprinters || 0,
          credit_value: user.credit_value || 0,
          credit_generation_level: user.credit_generation_level || 0,
          credit_capacity_level: user.credit_capacity_level || 0,
        },
      });
    } catch (error) {
      console.error("Error logging in user:", error);
      return res.status(500).json({ error: "Failed to login" });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await getUserById(req.session.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.json({
        user: {
          id: user.id,
          email: user.email,
          tickets_contributed: user.tickets_contributed,
          printer_supplies: user.printer_supplies,
          money: user.money,
          gold: user.gold,
          autoprinters: user.autoprinters || 0,
          credit_value: user.credit_value || 0,
          credit_generation_level: user.credit_generation_level || 0,
          credit_capacity_level: user.credit_capacity_level || 0,
        },
      });
    } catch (error) {
      console.error("Error fetching current user:", error);
      return res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err?: Error) => {
      if (err) {
        console.error("Error destroying session:", err);
        return res.status(500).json({ error: "Failed to logout" });
      }
      return res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/count", async (_req, res) => {
    try {
      const count = await getGlobalCount();
      return res.json({ count });
    } catch (error) {
      console.error("Error getting count:", error);
      return res.status(500).json({ error: "Failed to retrieve count" });
    }
  });

  // NEW GENERIC OPERATION ENDPOINT
  app.post("/api/operations/:operationId", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const operationIdParam = req.params.operationId;
      if (!Object.prototype.hasOwnProperty.call(operations, operationIdParam)) {
        return res.status(404).json({ error: "Unknown operation" });
      }

      const operationId = operationIdParam as OperationId;
      const operation = operations[operationId];

      const user = await getUserById(req.session.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get global ticket count for validation
      const globalTicketCount = await getGlobalCount();

      // Validate operation
      const validation = validateOperation(
        user,
        operation,
        req.body,
        globalTicketCount,
      );
      if (!validation.valid) {
        if (validation.error === "Insufficient resources") {
          return res.status(403).json({
            error: validation.error,
            insufficientResources: validation.insufficientResources,
            cost: validation.cost,
            gain: validation.gain,
          });
        }

        return res.status(400).json({
          error: validation.error || "Invalid operation parameters",
          cost: validation.cost,
          gain: validation.gain,
        });
      }

      // Execute the transaction
      const updatedUser = await executeResourceTransaction(
        req.session.userId,
        validation.cost,
        validation.gain,
      );

      // Handle ticket printing if applicable
      const gainedTickets =
        validation.gain[ResourceType.TICKETS_CONTRIBUTED] ?? 0;
      let newCount: number | null = null;

      if (gainedTickets > 0) {
        for (let i = 0; i < gainedTickets; i += 1) {
          newCount = await incrementGlobalCount();
        }

        if (newCount !== null) {
          broadcastCount(newCount);
        }
      }

      // Handle global ticket cost and broadcast updated count
      const globalTicketCost =
        validation.cost[ResourceType.GLOBAL_TICKETS] ?? 0;
      if (globalTicketCost > 0) {
        // Fetch and broadcast the new global count
        newCount = await getGlobalCount();
        broadcastCount(newCount);
      }

      // Broadcast user updates
      await sendUserUpdate(req.session.userId, {
        supplies: updatedUser.printer_supplies,
        money: updatedUser.money,
        gold: updatedUser.gold,
        autoprinters: updatedUser.autoprinters,
        tickets_contributed: updatedUser.tickets_contributed,
        credit_value: updatedUser.credit_value,
        credit_generation_level: updatedUser.credit_generation_level,
        credit_capacity_level: updatedUser.credit_capacity_level,
      });

      return res.json({
        operationId,
        cost: validation.cost,
        gain: validation.gain,
        count: newCount,
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          tickets_contributed: updatedUser.tickets_contributed,
          printer_supplies: updatedUser.printer_supplies,
          money: updatedUser.money,
          gold: updatedUser.gold,
          autoprinters: updatedUser.autoprinters || 0,
          credit_value: updatedUser.credit_value || 0,
          credit_generation_level: updatedUser.credit_generation_level || 0,
          credit_capacity_level: updatedUser.credit_capacity_level || 0,
        },
      });
    } catch (error) {
      console.error("Error executing operation:", error);
      return res.status(500).json({
        error: "Failed to execute operation",
        details: getErrorMessage(error),
      });
    }
  });

  return app;
}

function createServer(app: Express): Server {
  const httpServer = http.createServer(app);
  wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", async (socket: WebSocket) => {
    try {
      const count = await getGlobalCount();
      socket.send(JSON.stringify({ count }));
    } catch (error) {
      console.error("Error sending initial count to WebSocket client:", error);
    }

    socket.on("message", (data: RawData) => {
      try {
        const message = JSON.parse(data.toString()) as IncomingSocketMessage;

        if (message.type === "authenticate" && message.userId !== undefined) {
          const userId =
            typeof message.userId === "number"
              ? message.userId
              : Number.parseInt(message.userId, 10);

          if (!Number.isNaN(userId)) {
            socketUserMap.set(socket, userId);
            socket.send(JSON.stringify({ authenticated: true }));
          }
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
      }
    });

    socket.on("close", () => {
      socketUserMap.delete(socket);
    });
  });

  return httpServer;
}

// Start server only if this is the main module (not when required by tests)
// Check if the script was invoked directly (contains index.js in argv[1])
// When required by tests, process.argv[1] will be different (jest)
const isMainModule = process.argv[1]?.includes("index.js") ?? false;

if (isMainModule) {
  (async () => {
    try {
      await initializeDatabase();
      console.log("Database initialized successfully");

      const app = createApp();
      server = createServer(app);

      server.listen(PORT, () => {
        console.log(
          `ever-greater-server listening on http://localhost:${PORT}`,
        );
      });

      autoprinterInterval = setInterval(async () => {
        try {
          const result = await processAutoprinters();
          if (result.totalTickets > 0 && result.newGlobalCount !== null) {
            broadcastCount(result.newGlobalCount);
            await broadcastAutoprinterUpdates();
          }
        } catch (error) {
          console.error("Error processing autoprinters:", error);
        }
      }, 4000);

      creditUpdateInterval = setInterval(async () => {
        try {
          await updateAllUsersCreditValues();
          await broadcastCreditUpdates();
        } catch (error) {
          console.error("Error updating user credit values:", error);
        }
      }, 1000);

      ticketCleanupInterval = setInterval(async () => {
        try {
          const deletedCount = await cleanupOldTicketWithdrawals();
          if (deletedCount > 0) {
            console.log(
              `Cleaned up ${deletedCount} old ticket withdrawal records`,
            );
          }
        } catch (error) {
          console.error("Error cleaning up old ticket withdrawals:", error);
        }
      }, 3600000); // 1 hour
    } catch (error) {
      console.error("Failed to initialize database:", error);
      process.exit(1);
    }
  })();
}

const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
  console.log(`\n${signal} received, shutting down gracefully...`);

  if (autoprinterInterval) {
    clearInterval(autoprinterInterval);
  }

  if (creditUpdateInterval) {
    clearInterval(creditUpdateInterval);
  }

  if (ticketCleanupInterval) {
    clearInterval(ticketCleanupInterval);
  }

  if (server) {
    server.close(() => {
      console.log("HTTP server closed");

      if (wss) {
        wss.close(() => {
          console.log("WebSocket server closed");

          closePool().then(() => {
            console.log("Database pool closed");
            process.exit(0);
          });
        });
      } else {
        closePool().then(() => {
          console.log("Database pool closed");
          process.exit(0);
        });
      }
    });
  } else if (wss) {
    wss.close(() => {
      console.log("WebSocket server closed");
      closePool().then(() => {
        console.log("Database pool closed");
        process.exit(0);
      });
    });
  } else {
    await closePool();
    console.log("Database pool closed");
    process.exit(0);
  }

  setTimeout(() => {
    console.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

export { createApp, createServer };
