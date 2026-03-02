"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServer = exports.createApp = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const connect_pg_simple_1 = __importDefault(require("connect-pg-simple"));
const cors_1 = __importDefault(require("cors"));
require("dotenv/config");
const ever_greater_shared_1 = require("ever-greater-shared");
const express_1 = __importDefault(require("express"));
const express_session_1 = __importDefault(require("express-session"));
const http_1 = __importDefault(require("http"));
const ws_1 = require("ws");
const db_1 = require("./db");
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
let wss;
let server;
let autoprinterInterval;
const socketUserMap = new Map();
const PgSession = (0, connect_pg_simple_1.default)(express_session_1.default);
function getErrorMessage(error) {
    return error instanceof Error ? error.message : "Unknown error";
}
function broadcastCount(count) {
    if (!wss)
        return;
    const payload = JSON.stringify({ count });
    wss.clients.forEach((client) => {
        if (client.readyState === ws_1.WebSocket.OPEN) {
            client.send(payload);
        }
    });
}
async function sendUserUpdate(userId, updates) {
    if (!wss)
        return;
    wss.clients.forEach((client) => {
        if (client.readyState === ws_1.WebSocket.OPEN &&
            socketUserMap.get(client) === userId) {
            const payload = JSON.stringify({ user_update: updates });
            client.send(payload);
        }
    });
}
async function broadcastAutoprinterUpdates() {
    if (!wss)
        return;
    const userIds = new Set();
    socketUserMap.forEach((userId) => {
        userIds.add(userId);
    });
    for (const userId of userIds) {
        try {
            const user = await (0, db_1.getUserById)(userId);
            if (user) {
                wss.clients.forEach((client) => {
                    if (client.readyState === ws_1.WebSocket.OPEN &&
                        socketUserMap.get(client) === userId) {
                        const payload = JSON.stringify({
                            user_update: {
                                supplies: user.printer_supplies,
                                money: user.money,
                                tickets_contributed: user.tickets_contributed,
                            },
                        });
                        client.send(payload);
                    }
                });
            }
        }
        catch (error) {
            console.error(`Error sending autoprinter update to user ${userId}:`, error);
        }
    }
}
function createApp() {
    const app = (0, express_1.default)();
    app.use((0, cors_1.default)({
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        credentials: true,
    }));
    app.use(express_1.default.json());
    app.use((0, express_session_1.default)({
        store: new PgSession({
            pool: db_1.pool,
            tableName: "session",
        }),
        secret: process.env.SESSION_SECRET || "your-secret-key-change-in-production",
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === "production",
            httpOnly: true,
            maxAge: 30 * 24 * 60 * 60 * 1000,
        },
    }));
    app.post("/api/auth/register", async (req, res) => {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res
                    .status(400)
                    .json({ error: "Email and password are required" });
            }
            const existingUser = await (0, db_1.getUserByEmail)(email);
            if (existingUser) {
                return res.status(409).json({ error: "Email already in use" });
            }
            const saltRounds = 10;
            const passwordHash = await bcryptjs_1.default.hash(password, saltRounds);
            const user = await (0, db_1.createUser)(email, passwordHash);
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
                },
            });
        }
        catch (error) {
            console.error("Error registering user:", error);
            return res.status(500).json({ error: "Failed to register user" });
        }
    });
    app.post("/api/auth/login", async (req, res) => {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res
                    .status(400)
                    .json({ error: "Email and password are required" });
            }
            const user = await (0, db_1.getUserByEmail)(email);
            if (!user) {
                return res.status(401).json({ error: "Invalid email or password" });
            }
            const isValidPassword = await bcryptjs_1.default.compare(password, user.password_hash);
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
                },
            });
        }
        catch (error) {
            console.error("Error logging in user:", error);
            return res.status(500).json({ error: "Failed to login" });
        }
    });
    app.get("/api/auth/me", async (req, res) => {
        try {
            if (!req.session.userId) {
                return res.status(401).json({ error: "Not authenticated" });
            }
            const user = await (0, db_1.getUserById)(req.session.userId);
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
                },
            });
        }
        catch (error) {
            console.error("Error fetching current user:", error);
            return res.status(500).json({ error: "Failed to fetch user" });
        }
    });
    app.post("/api/auth/logout", (req, res) => {
        req.session.destroy((err) => {
            if (err) {
                console.error("Error destroying session:", err);
                return res.status(500).json({ error: "Failed to logout" });
            }
            return res.json({ message: "Logged out successfully" });
        });
    });
    app.get("/api/count", async (_req, res) => {
        try {
            const count = await (0, db_1.getGlobalCount)();
            return res.json({ count });
        }
        catch (error) {
            console.error("Error getting count:", error);
            return res.status(500).json({ error: "Failed to retrieve count" });
        }
    });
    app.post("/api/operations/:operationId", async (req, res) => {
        try {
            if (!req.session.userId) {
                return res.status(401).json({ error: "Not authenticated" });
            }
            const operationIdParam = req.params.operationId;
            if (!Object.prototype.hasOwnProperty.call(ever_greater_shared_1.operations, operationIdParam)) {
                return res.status(404).json({ error: "Unknown operation" });
            }
            const operationId = operationIdParam;
            const operation = ever_greater_shared_1.operations[operationId];
            const user = await (0, db_1.getUserById)(req.session.userId);
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }
            const validation = (0, ever_greater_shared_1.validateOperation)(user, operation, req.body);
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
            const updatedUser = await (0, db_1.executeResourceTransaction)(req.session.userId, validation.cost, validation.gain);
            const gainedTickets = validation.gain[ever_greater_shared_1.ResourceType.TICKETS_CONTRIBUTED] ?? 0;
            let newCount = null;
            if (gainedTickets > 0) {
                for (let i = 0; i < gainedTickets; i += 1) {
                    newCount = await (0, db_1.incrementGlobalCount)();
                }
                if (newCount !== null) {
                    broadcastCount(newCount);
                }
            }
            await sendUserUpdate(req.session.userId, {
                supplies: updatedUser.printer_supplies,
                money: updatedUser.money,
                gold: updatedUser.gold,
                autoprinters: updatedUser.autoprinters,
                tickets_contributed: updatedUser.tickets_contributed,
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
                },
            });
        }
        catch (error) {
            console.error("Error executing operation:", error);
            return res.status(500).json({
                error: "Failed to execute operation",
                details: getErrorMessage(error),
            });
        }
    });
    return app;
}
exports.createApp = createApp;
function createServer(app) {
    const httpServer = http_1.default.createServer(app);
    wss = new ws_1.WebSocketServer({ server: httpServer, path: "/ws" });
    wss.on("connection", async (socket) => {
        try {
            const count = await (0, db_1.getGlobalCount)();
            socket.send(JSON.stringify({ count }));
        }
        catch (error) {
            console.error("Error sending initial count to WebSocket client:", error);
        }
        socket.on("message", (data) => {
            try {
                const message = JSON.parse(data.toString());
                if (message.type === "authenticate" && message.userId !== undefined) {
                    const userId = typeof message.userId === "number"
                        ? message.userId
                        : Number.parseInt(message.userId, 10);
                    if (!Number.isNaN(userId)) {
                        socketUserMap.set(socket, userId);
                        socket.send(JSON.stringify({ authenticated: true }));
                    }
                }
            }
            catch (error) {
                console.error("Error processing WebSocket message:", error);
            }
        });
        socket.on("close", () => {
            socketUserMap.delete(socket);
        });
    });
    return httpServer;
}
exports.createServer = createServer;
if (require.main === module) {
    (async () => {
        try {
            await (0, db_1.initializeDatabase)();
            console.log("Database initialized successfully");
            const app = createApp();
            server = createServer(app);
            server.listen(PORT, () => {
                console.log(`ever-greater-server listening on http://localhost:${PORT}`);
            });
            autoprinterInterval = setInterval(async () => {
                try {
                    const result = await (0, db_1.processAutoprinters)();
                    if (result.totalTickets > 0 && result.newGlobalCount !== null) {
                        broadcastCount(result.newGlobalCount);
                        await broadcastAutoprinterUpdates();
                    }
                }
                catch (error) {
                    console.error("Error processing autoprinters:", error);
                }
            }, 4000);
            console.log("Autoprinter processor started (4 second interval)");
        }
        catch (error) {
            console.error("Failed to initialize database:", error);
            process.exit(1);
        }
    })();
    const shutdown = async (signal) => {
        console.log(`\n${signal} received, shutting down gracefully...`);
        if (autoprinterInterval) {
            clearInterval(autoprinterInterval);
            console.log("Autoprinter processor stopped");
        }
        if (server) {
            server.close(() => {
                console.log("HTTP server closed");
                if (wss) {
                    wss.close(() => {
                        console.log("WebSocket server closed");
                        (0, db_1.closePool)().then(() => {
                            console.log("Database pool closed");
                            process.exit(0);
                        });
                    });
                }
                else {
                    (0, db_1.closePool)().then(() => {
                        console.log("Database pool closed");
                        process.exit(0);
                    });
                }
            });
        }
        else if (wss) {
            wss.close(() => {
                console.log("WebSocket server closed");
                (0, db_1.closePool)().then(() => {
                    console.log("Database pool closed");
                    process.exit(0);
                });
            });
        }
        else {
            await (0, db_1.closePool)();
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
}
//# sourceMappingURL=index.js.map