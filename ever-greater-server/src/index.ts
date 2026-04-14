import bcrypt from "bcryptjs";
import connectPgSimple from "connect-pg-simple";
import cors from "cors";
import { randomUUID } from "crypto";
import "dotenv/config";
import {
  OperationId,
  operations,
  ResourceType,
  validateOperation,
  type GlobalCountUpdate,
  type UserResourceUpdate,
} from "ever-greater-shared";
import type { Request, Response } from "express";
import express, { type Express } from "express";
import session from "express-session";
import http, { type Server } from "http";
import { fileURLToPath } from "url";
import { WebSocket, WebSocketServer, type RawData } from "ws";
import { z } from "zod";
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
  purchaseAutoBuySupplies,
  setAutoBuySuppliesActive,
  updateAllUsersCreditValues,
} from "./db.js";

declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

const __filename = fileURLToPath(import.meta.url);
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const SESSION_SECRET_FALLBACK = "your-secret-key-change-in-production";

const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

function getAllowedOrigins(): string[] {
  const configuredOrigins = (process.env.CLIENT_URL || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return configuredOrigins.length > 0
    ? configuredOrigins
    : DEFAULT_ALLOWED_ORIGINS;
}

let wss: WebSocketServer | undefined;
let server: Server | undefined;
let autoprinterInterval: NodeJS.Timeout | undefined;
let creditUpdateInterval: NodeJS.Timeout | undefined;
let ticketCleanupInterval: NodeJS.Timeout | undefined;
const socketUserMap = new Map<WebSocket, number>();

const PgSession = connectPgSimple(session);

type UserUpdatePayload = Partial<{
  printer_supplies: number;
  money: number;
  gold: number;
  autoprinters: number;
  tickets_contributed: number;
  tickets_withdrawn: number;
  credit_value: number;
  credit_generation_level: number;
  credit_capacity_level: number;
  auto_buy_supplies_purchased: boolean;
  auto_buy_supplies_active: boolean;
}>;

function toClientUser(user: Awaited<ReturnType<typeof getUserById>>) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    tickets_contributed: user.tickets_contributed,
    tickets_withdrawn: user.tickets_withdrawn || 0,
    printer_supplies: user.printer_supplies,
    money: user.money,
    gold: user.gold,
    autoprinters: user.autoprinters || 0,
    credit_value: user.credit_value || 0,
    credit_generation_level: user.credit_generation_level || 0,
    credit_capacity_level: user.credit_capacity_level || 0,
    auto_buy_supplies_purchased: user.auto_buy_supplies_purchased || false,
    auto_buy_supplies_active: user.auto_buy_supplies_active || false,
  };
}

interface IncomingSocketMessage {
  type?: string;
  userId?: string | number;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

type LogLevel = "info" | "warn" | "error";

function logEvent(
  level: LogLevel,
  message: string,
  fields: Record<string, unknown> = {},
): void {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...fields,
  };
  const formatted = JSON.stringify(entry);
  if (level === "error") {
    console.error(formatted);
    return;
  }
  console.log(formatted);
}

function logRouteError(req: Request, error: unknown, message: string): void {
  logEvent("error", message, {
    method: req.method,
    route: req.path,
    requestId: req.header("x-request-id") ?? null,
    error: getErrorMessage(error),
  });
}

type ApiErrorPayload = {
  error: string;
  code: string;
  detail?: string;
} & Record<string, unknown>;

function sendError(
  res: Response,
  status: number,
  payload: ApiErrorPayload,
): Response {
  return res.status(status).json(payload);
}

const credentialsSchema = z.object({
  email: z.string(),
  password: z.string(),
});

const toggleAutoBuySuppliesSchema = z.object({
  active: z.boolean(),
});

const operationRequestSchema = z.object({
  quantity: z.number().int().positive().optional(),
});

function broadcastCount(count: number): void {
  if (!wss) return;
  const payload = JSON.stringify({
    type: "GLOBAL_COUNT_UPDATE",
    count,
  } satisfies GlobalCountUpdate);
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

  const message: UserResourceUpdate = {
    type: "USER_RESOURCE_UPDATE",
    user_update: updates,
  };
  wss.clients.forEach((client) => {
    if (
      client.readyState === WebSocket.OPEN &&
      socketUserMap.get(client) === userId
    ) {
      client.send(JSON.stringify(message));
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
              type: "USER_RESOURCE_UPDATE",
              user_update: {
                printer_supplies: user.printer_supplies,
                money: user.money,
                tickets_contributed: user.tickets_contributed,
                tickets_withdrawn: user.tickets_withdrawn,
              },
            } satisfies UserResourceUpdate);
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
              type: "USER_RESOURCE_UPDATE",
              user_update: {
                credit_value: user.credit_value,
              },
            } satisfies UserResourceUpdate);
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
  const allowedOrigins = getAllowedOrigins();

  app.use((req, res, next) => {
    const requestId = randomUUID();
    req.headers["x-request-id"] = requestId;
    res.setHeader("x-request-id", requestId);
    next();
  });

  app.use(
    cors({
      origin(origin, callback) {
        // Allow requests without an Origin header (e.g. curl, server-to-server).
        if (!origin) {
          callback(null, true);
          return;
        }

        if (allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error(`Not allowed by CORS: ${origin}`));
      },
      credentials: true,
    }),
  );
  app.use(express.json());

  // Use MemoryStore for testing, PgSession for production
  const isTestEnvironment =
    process.env.NODE_ENV === "test" || process.env.VITEST === "true";
  const sessionSecret = process.env.SESSION_SECRET || SESSION_SECRET_FALLBACK;
  if (
    process.env.NODE_ENV === "production" &&
    sessionSecret === SESSION_SECRET_FALLBACK
  ) {
    throw new Error("SESSION_SECRET must be configured in production");
  }

  const sessionStore = isTestEnvironment
    ? undefined // Uses default MemoryStore
    : new PgSession({
        pool,
        tableName: "session",
      });

  app.use(
    session({
      store: sessionStore,
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000,
      },
    }),
  );

  app.get("/health", async (req, res) => {
    try {
      await pool.query("SELECT 1");
      return res.json({
        status: "ok",
        db: "up",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logRouteError(req, error, "Health check failed");
      return res.status(503).json({
        status: "error",
        db: "down",
        error: getErrorMessage(error),
        timestamp: new Date().toISOString(),
      });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const credentialsResult = credentialsSchema.safeParse(req.body);
      if (
        !credentialsResult.success ||
        credentialsResult.data.email.trim() === "" ||
        credentialsResult.data.password === ""
      ) {
        return sendError(res, 400, {
          error: "Email and password are required",
          code: "INVALID_REQUEST",
          detail: "Request body must include non-empty email and password",
        });
      }

      const { email, password } = credentialsResult.data;

      const existingUser = await getUserByEmail(email);
      if (existingUser) {
        return sendError(res, 409, {
          error: "Email already in use",
          code: "EMAIL_ALREADY_IN_USE",
        });
      }

      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      const user = await createUser(email, passwordHash);

      req.session.userId = user.id;

      return res.status(201).json({ user: toClientUser(user) });
    } catch (error) {
      logRouteError(req, error, "Error registering user");
      return sendError(res, 500, {
        error: "Failed to register user",
        code: "REGISTER_FAILED",
        detail: getErrorMessage(error),
      });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const credentialsResult = credentialsSchema.safeParse(req.body);
      if (
        !credentialsResult.success ||
        credentialsResult.data.email.trim() === "" ||
        credentialsResult.data.password === ""
      ) {
        return sendError(res, 400, {
          error: "Email and password are required",
          code: "INVALID_REQUEST",
          detail: "Request body must include non-empty email and password",
        });
      }

      const { email, password } = credentialsResult.data;

      const user = await getUserByEmail(email);
      if (!user) {
        return sendError(res, 401, {
          error: "Invalid email or password",
          code: "INVALID_CREDENTIALS",
        });
      }

      const isValidPassword = await bcrypt.compare(
        password,
        user.password_hash,
      );
      if (!isValidPassword) {
        return sendError(res, 401, {
          error: "Invalid email or password",
          code: "INVALID_CREDENTIALS",
        });
      }

      req.session.userId = user.id;

      return res.json({ user: toClientUser(user) });
    } catch (error) {
      logRouteError(req, error, "Error logging in user");
      return sendError(res, 500, {
        error: "Failed to login",
        code: "LOGIN_FAILED",
        detail: getErrorMessage(error),
      });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    try {
      if (!req.session.userId) {
        return sendError(res, 401, {
          error: "Not authenticated",
          code: "AUTH_REQUIRED",
        });
      }

      const user = await getUserById(req.session.userId);
      if (!user) {
        return sendError(res, 404, {
          error: "User not found",
          code: "USER_NOT_FOUND",
        });
      }

      return res.json({ user: toClientUser(user) });
    } catch (error) {
      logRouteError(req, error, "Error fetching current user");
      return sendError(res, 500, {
        error: "Failed to fetch user",
        code: "FETCH_USER_FAILED",
        detail: getErrorMessage(error),
      });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err?: Error) => {
      if (err) {
        logRouteError(req, err, "Error destroying session");
        return sendError(res, 500, {
          error: "Failed to logout",
          code: "LOGOUT_FAILED",
          detail: getErrorMessage(err),
        });
      }
      return res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/count", async (req, res) => {
    try {
      const count = await getGlobalCount();
      return res.json({ count });
    } catch (error) {
      logRouteError(req, error, "Error getting count");
      return res.status(500).json({ error: "Failed to retrieve count" });
    }
  });

  app.post("/api/auth/auto-buy-supplies/toggle", async (req, res) => {
    try {
      if (!req.session.userId) {
        return sendError(res, 401, {
          error: "Not authenticated",
          code: "AUTH_REQUIRED",
        });
      }

      const toggleResult = toggleAutoBuySuppliesSchema.safeParse(req.body);
      if (!toggleResult.success) {
        return sendError(res, 400, {
          error: "'active' boolean is required",
          code: "INVALID_REQUEST",
          detail: "Request body must include an 'active' boolean",
        });
      }

      const { active } = toggleResult.data;

      const existingUser = await getUserById(req.session.userId);
      if (!existingUser) {
        return sendError(res, 404, {
          error: "User not found",
          code: "USER_NOT_FOUND",
        });
      }

      if (!existingUser.auto_buy_supplies_purchased) {
        return sendError(res, 403, {
          error: "Auto-buy supplies not unlocked",
          code: "AUTO_BUY_SUPPLIES_NOT_UNLOCKED",
        });
      }

      const updatedUser = await setAutoBuySuppliesActive(
        req.session.userId,
        active,
      );

      await sendUserUpdate(req.session.userId, {
        auto_buy_supplies_purchased: updatedUser.auto_buy_supplies_purchased,
        auto_buy_supplies_active: updatedUser.auto_buy_supplies_active,
      });

      return res.json({ user: toClientUser(updatedUser) });
    } catch (error) {
      logRouteError(req, error, "Error toggling auto-buy supplies");
      return sendError(res, 500, {
        error: "Failed to toggle auto-buy supplies",
        code: "AUTO_BUY_SUPPLIES_TOGGLE_FAILED",
        detail: getErrorMessage(error),
      });
    }
  });

  // NEW GENERIC OPERATION ENDPOINT
  app.post("/api/operations/:operationId", async (req, res) => {
    try {
      if (!req.session.userId) {
        return sendError(res, 401, {
          error: "Not authenticated",
          code: "AUTH_REQUIRED",
        });
      }

      const operationIdResult = z
        .nativeEnum(OperationId)
        .safeParse(req.params.operationId);
      if (!operationIdResult.success) {
        return sendError(res, 400, {
          error: "INVALID_REQUEST",
          code: "INVALID_REQUEST",
          detail: `Unknown operationId: ${req.params.operationId}`,
        });
      }

      const requestBodyResult = operationRequestSchema.safeParse(
        req.body ?? {},
      );
      if (!requestBodyResult.success) {
        return sendError(res, 400, {
          error: "INVALID_REQUEST",
          code: "INVALID_REQUEST",
          detail: "quantity must be a positive integer",
        });
      }

      const requestBody = requestBodyResult.data;

      const operationId = operationIdResult.data;
      const operation = operations[operationId];

      const user = await getUserById(req.session.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get global ticket count for validation
      const globalTicketCount = await getGlobalCount();

      let userForValidation = user;

      // Auto-buy fallback: if print is requested with insufficient supplies and
      // auto-buy is active, try to purchase supplies before validating print again.
      if (
        operationId === OperationId.PRINT_TICKET &&
        user.auto_buy_supplies_active
      ) {
        const initialPrintValidation = validateOperation(
          user,
          operation,
          requestBody,
          globalTicketCount,
        );

        const missingPrinterSupplies =
          !initialPrintValidation.valid &&
          initialPrintValidation.error === "Insufficient resources" &&
          initialPrintValidation.insufficientResources?.includes(
            ResourceType.PRINTER_SUPPLIES,
          );

        if (missingPrinterSupplies) {
          const buySuppliesOperation = operations[OperationId.BUY_SUPPLIES];
          const buySuppliesValidation = validateOperation(
            user,
            buySuppliesOperation,
            undefined,
            globalTicketCount,
          );

          if (buySuppliesValidation.valid) {
            try {
              userForValidation = await executeResourceTransaction(
                req.session.userId,
                buySuppliesValidation.cost,
                buySuppliesValidation.gain,
              );
            } catch {
              // Preserve existing error semantics for print: if fallback buy cannot
              // complete due races or resources, print validation below reports
              // insufficient printer supplies.
            }
          }
        }
      }

      // Validate operation
      const validation = validateOperation(
        userForValidation,
        operation,
        requestBody,
        globalTicketCount,
      );
      if (!validation.valid) {
        if (validation.error === "Insufficient resources") {
          return sendError(res, 403, {
            error: validation.error,
            code: "INSUFFICIENT_RESOURCES",
            insufficientResources: validation.insufficientResources,
            cost: validation.cost,
            gain: validation.gain,
          });
        }

        return sendError(res, 400, {
          error: validation.error || "Invalid operation parameters",
          code: "INVALID_OPERATION",
          cost: validation.cost,
          gain: validation.gain,
        });
      }

      // Execute the transaction.
      const updatedUser =
        operationId === OperationId.AUTO_BUY_SUPPLIES
          ? await purchaseAutoBuySupplies(
              req.session.userId,
              validation.cost[ResourceType.GOLD] ?? 0,
            )
          : await executeResourceTransaction(
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
        printer_supplies: updatedUser.printer_supplies,
        money: updatedUser.money,
        gold: updatedUser.gold,
        autoprinters: updatedUser.autoprinters,
        tickets_contributed: updatedUser.tickets_contributed,
        tickets_withdrawn: updatedUser.tickets_withdrawn,
        credit_value: updatedUser.credit_value,
        credit_generation_level: updatedUser.credit_generation_level,
        credit_capacity_level: updatedUser.credit_capacity_level,
        auto_buy_supplies_purchased: updatedUser.auto_buy_supplies_purchased,
        auto_buy_supplies_active: updatedUser.auto_buy_supplies_active,
      });

      return res.json({
        operationId,
        cost: validation.cost,
        gain: validation.gain,
        count: newCount,
        user: toClientUser(updatedUser),
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === "GlobalTicketLimitExceeded"
      ) {
        return sendError(res, 403, {
          error: "GLOBAL_TICKET_LIMIT",
          code: "GLOBAL_TICKET_LIMIT",
          detail: error.message,
        });
      }
      logRouteError(req, error, "Error executing operation");
      return sendError(res, 500, {
        error: "Failed to execute operation",
        code: "OPERATION_EXECUTION_FAILED",
        detail: getErrorMessage(error),
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
      socket.send(
        JSON.stringify({
          type: "GLOBAL_COUNT_UPDATE",
          count,
        } satisfies GlobalCountUpdate),
      );
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
