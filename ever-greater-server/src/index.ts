import bcrypt from "bcryptjs";
import connectPgSimple from "connect-pg-simple";
import cors from "cors";
import { randomUUID } from "crypto";
import "dotenv/config";
import {
  isClientOperationId,
  OperationId,
  type GlobalCountUpdate,
  type UserResourceUpdate,
} from "ever-greater-shared";
import type { Request, Response } from "express";
import express, { type Express } from "express";
import session from "express-session";
import http, { type Server } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { WebSocket, WebSocketServer, type RawData } from "ws";
import { z } from "zod";
import { assertRequiredEnvironment, getServerConfig } from "./config.js";
import {
  cleanupOldTicketWithdrawals,
  closePool,
  createUser,
  getGlobalCount,
  getUserByEmail,
  getUserById,
  pool,
  prepareDatabaseForRuntime,
  processAutoprinters,
  updateAllUsersCreditValues,
} from "./db.js";
import {
  executeOperationForUser,
  OperationUserNotFoundError,
  OperationValidationError,
} from "./operations/execution.js";

declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

const __filename = fileURLToPath(import.meta.url);
const SESSION_SECRET_FALLBACK = "your-secret-key-change-in-production";

let wss: WebSocketServer | undefined;
let server: Server | undefined;
let autoprinterInterval: NodeJS.Timeout | undefined;
let ticketCleanupInterval: NodeJS.Timeout | undefined;
const socketUserMap = new Map<WebSocket, number>();
const userPeriodicSnapshotMap = new Map<number, Required<UserUpdatePayload>>();

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
  manual_print_batch_level: number;
  supplies_batch_level: number;
  auto_buy_supplies_purchased: boolean;
  auto_buy_supplies_active: boolean;
}>;

function toPeriodicUserSnapshot(
  user: NonNullable<Awaited<ReturnType<typeof getUserById>>>,
): Required<UserUpdatePayload> {
  return {
    printer_supplies: user.printer_supplies,
    money: user.money,
    gold: user.gold,
    autoprinters: user.autoprinters || 0,
    tickets_contributed: user.tickets_contributed,
    tickets_withdrawn: user.tickets_withdrawn || 0,
    credit_value: user.credit_value || 0,
    credit_generation_level: user.credit_generation_level || 0,
    credit_capacity_level: user.credit_capacity_level || 0,
    manual_print_batch_level: user.manual_print_batch_level || 0,
    supplies_batch_level: user.supplies_batch_level || 0,
    auto_buy_supplies_purchased: user.auto_buy_supplies_purchased || false,
    auto_buy_supplies_active: user.auto_buy_supplies_active || false,
  };
}

function buildPeriodicUserUpdatePayload(
  current: Required<UserUpdatePayload>,
  previous: Required<UserUpdatePayload> | undefined,
): UserUpdatePayload {
  const payload: UserUpdatePayload = {
    printer_supplies: current.printer_supplies,
    tickets_contributed: current.tickets_contributed,
    tickets_withdrawn: current.tickets_withdrawn,
    credit_value: current.credit_value,
  };

  if (!previous || previous.money !== current.money) {
    payload.money = current.money;
  }

  if (!previous || previous.gold !== current.gold) {
    payload.gold = current.gold;
  }

  if (!previous || previous.autoprinters !== current.autoprinters) {
    payload.autoprinters = current.autoprinters;
  }

  if (
    !previous ||
    previous.credit_generation_level !== current.credit_generation_level
  ) {
    payload.credit_generation_level = current.credit_generation_level;
  }

  if (
    !previous ||
    previous.credit_capacity_level !== current.credit_capacity_level
  ) {
    payload.credit_capacity_level = current.credit_capacity_level;
  }

  if (
    !previous ||
    previous.manual_print_batch_level !== current.manual_print_batch_level
  ) {
    payload.manual_print_batch_level = current.manual_print_batch_level;
  }

  if (
    !previous ||
    previous.supplies_batch_level !== current.supplies_batch_level
  ) {
    payload.supplies_batch_level = current.supplies_batch_level;
  }

  if (
    !previous ||
    previous.auto_buy_supplies_purchased !== current.auto_buy_supplies_purchased
  ) {
    payload.auto_buy_supplies_purchased = current.auto_buy_supplies_purchased;
  }

  if (
    !previous ||
    previous.auto_buy_supplies_active !== current.auto_buy_supplies_active
  ) {
    payload.auto_buy_supplies_active = current.auto_buy_supplies_active;
  }

  return payload;
}

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
    manual_print_batch_level: user.manual_print_batch_level || 0,
    supplies_batch_level: user.supplies_batch_level || 0,
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

function sendOperationValidationError(
  res: Response,
  error: OperationValidationError,
): Response {
  const { validation } = error;

  if (validation.error === "Insufficient resources") {
    return sendError(res, 403, {
      error: validation.error,
      code: "INSUFFICIENT_RESOURCES",
      insufficientResources: validation.insufficientResources,
      cost: validation.cost,
      gain: validation.gain,
    });
  }

  if (validation.error === "Auto-buy supplies not unlocked") {
    return sendError(res, 403, {
      error: validation.error,
      code: "AUTO_BUY_SUPPLIES_NOT_UNLOCKED",
      cost: validation.cost,
      gain: validation.gain,
    });
  }

  if (
    validation.error === "Quantity must be a positive integer" ||
    validation.error === "'active' boolean is required"
  ) {
    return sendError(res, 400, {
      error: "INVALID_REQUEST",
      code: "INVALID_REQUEST",
      detail:
        validation.error === "Quantity must be a positive integer"
          ? "quantity must be a positive integer"
          : validation.error,
    });
  }

  return sendError(res, 400, {
    error: validation.error || "Invalid operation parameters",
    code: "INVALID_OPERATION",
    cost: validation.cost,
    gain: validation.gain,
  });
}

const credentialsSchema = z.object({
  email: z.string(),
  password: z.string(),
});

const operationRequestSchema = z.object({}).passthrough();

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

function getConnectedUserIds(): Set<number> {
  const userIds = new Set<number>();
  socketUserMap.forEach((userId) => {
    userIds.add(userId);
  });

  return userIds;
}

async function broadcastPeriodicUserUpdates(): Promise<void> {
  if (!wss) return;

  const userIds = getConnectedUserIds();

  for (const userId of userIds) {
    try {
      const user = await getUserById(userId);
      if (user) {
        const currentSnapshot = toPeriodicUserSnapshot(user);
        const previousSnapshot = userPeriodicSnapshotMap.get(userId);

        await sendUserUpdate(
          userId,
          buildPeriodicUserUpdatePayload(currentSnapshot, previousSnapshot),
        );

        userPeriodicSnapshotMap.set(userId, currentSnapshot);
      }
    } catch (error) {
      console.error(
        `Error sending periodic user update to user ${userId}:`,
        error,
      );
    }
  }
}

function createApp(): Express {
  const serverConfig = getServerConfig();
  const app = express();
  const allowedOrigins = serverConfig.allowedOrigins;

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
    serverConfig.nodeEnv === "test" || process.env.VITEST === "true";
  const sessionSecret = serverConfig.sessionSecret || SESSION_SECRET_FALLBACK;
  if (serverConfig.nodeEnv === "production" && !serverConfig.sessionSecret) {
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
        secure: serverConfig.nodeEnv === "production",
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
          detail: "Request body must be a JSON object",
        });
      }

      const requestBody = requestBodyResult.data;

      const operationId = operationIdResult.data;
      if (!isClientOperationId(operationId)) {
        return sendError(res, 400, {
          error: "INVALID_REQUEST",
          code: "INVALID_REQUEST",
          detail: `Unknown operationId: ${req.params.operationId}`,
        });
      }

      const result = await executeOperationForUser(
        req.session.userId,
        operationId,
        requestBody,
        { allowPrintAutoBuyFallback: true },
      );

      if (result.count !== null) {
        broadcastCount(result.count);
      }

      // Broadcast user updates
      await sendUserUpdate(req.session.userId, {
        printer_supplies: result.user.printer_supplies,
        money: result.user.money,
        gold: result.user.gold,
        autoprinters: result.user.autoprinters,
        tickets_contributed: result.user.tickets_contributed,
        tickets_withdrawn: result.user.tickets_withdrawn,
        credit_value: result.user.credit_value,
        credit_generation_level: result.user.credit_generation_level,
        credit_capacity_level: result.user.credit_capacity_level,
        manual_print_batch_level: result.user.manual_print_batch_level,
        supplies_batch_level: result.user.supplies_batch_level,
        auto_buy_supplies_purchased: result.user.auto_buy_supplies_purchased,
        auto_buy_supplies_active: result.user.auto_buy_supplies_active,
      });

      return res.json({
        operationId: result.operationId,
        cost: result.cost,
        gain: result.gain,
        count: result.count,
        user: toClientUser(result.user),
      });
    } catch (error) {
      if (error instanceof OperationValidationError) {
        return sendOperationValidationError(res, error);
      }
      if (error instanceof OperationUserNotFoundError) {
        return sendError(res, 404, {
          error: "User not found",
          code: "USER_NOT_FOUND",
        });
      }
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
      const disconnectedUserId = socketUserMap.get(socket);
      socketUserMap.delete(socket);

      if (disconnectedUserId === undefined) {
        return;
      }

      const hasOtherConnectionsForUser = Array.from(
        socketUserMap.values(),
      ).some((mappedUserId) => mappedUserId === disconnectedUserId);

      if (!hasOtherConnectionsForUser) {
        userPeriodicSnapshotMap.delete(disconnectedUserId);
      }
    });
  });

  return httpServer;
}

function normalizeFilePath(filePath: string): string {
  return path.normalize(filePath).toLowerCase();
}

function isDirectExecutionTarget(candidatePath: string | undefined): boolean {
  if (!candidatePath) {
    return false;
  }

  return (
    normalizeFilePath(path.resolve(candidatePath)) ===
    normalizeFilePath(__filename)
  );
}

async function startServer(): Promise<void> {
  const serverConfig = getServerConfig();
  const port = serverConfig.port;

  assertRequiredEnvironment(serverConfig);

  try {
    await prepareDatabaseForRuntime();
    console.log("Database ready for runtime");

    const app = createApp();
    server = createServer(app);

    server.listen(port, () => {
      console.log(`ever-greater-server listening on http://localhost:${port}`);
    });

    let periodicTickSeconds = 0;

    autoprinterInterval = setInterval(async () => {
      try {
        periodicTickSeconds += 1;
        const shouldRunAutoprinter = periodicTickSeconds % 4 === 0;

        if (shouldRunAutoprinter) {
          const result = await processAutoprinters();

          if (
            result?.newGlobalCount !== null &&
            result?.newGlobalCount !== undefined
          ) {
            broadcastCount(result.newGlobalCount);
          }
        }

        await updateAllUsersCreditValues();

        await broadcastPeriodicUserUpdates();
      } catch (error) {
        console.error("Error processing periodic game updates:", error);
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
    console.error("Failed to prepare database for runtime:", error);
    process.exit(1);
  }
}

if (isDirectExecutionTarget(process.argv[1])) {
  void startServer();
}

const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
  console.log(`\n${signal} received, shutting down gracefully...`);

  if (autoprinterInterval) {
    clearInterval(autoprinterInterval);
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

export { buildPeriodicUserUpdatePayload, createApp, createServer, startServer };
