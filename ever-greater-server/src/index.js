require('dotenv').config();
const http = require("http");
const express = require("express");
const cors = require("cors");
const { WebSocketServer, WebSocket } = require("ws");
const { initializeDatabase, getGlobalCount, incrementGlobalCount, closePool } = require('./db');

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const app = express();

app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

function broadcastCount(count) {
  const payload = JSON.stringify({ count });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

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
    const newCount = await incrementGlobalCount();
    broadcastCount(newCount);
    res.json({ count: newCount });
  } catch (error) {
    console.error('Error incrementing count:', error);
    res.status(500).json({ error: 'Failed to increment count' });
  }
});

wss.on("connection", async (socket) => {
  try {
    const count = await getGlobalCount();
    socket.send(JSON.stringify({ count }));
  } catch (error) {
    console.error('Error sending initial count to WebSocket client:', error);
  }
});

// Initialize database and start server
(async () => {
  try {
    await initializeDatabase();
    console.log('Database initialized successfully');
    
    server.listen(PORT, () => {
      console.log(`ever-greater-server listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
})();

// Graceful shutdown handlers
const shutdown = async (signal) => {
  console.log(`\n${signal} received, shutting down gracefully...`);

  wss.close(() => {
    console.log('WebSocket server closed');

    server.close(async () => {
      console.log('HTTP server closed');
      await closePool();
      process.exit(0);
    });
  });
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
