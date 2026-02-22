const http = require("http");
const express = require("express");
const cors = require("cors");
const { WebSocketServer, WebSocket } = require("ws");

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const app = express();

app.use(cors());
app.use(express.json());

let globalTicketCount = 0;

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

function broadcastCount() {
  const payload = JSON.stringify({ count: globalTicketCount });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

app.get("/api/count", (req, res) => {
  res.json({ count: globalTicketCount });
});

app.post("/api/increment", (req, res) => {
  globalTicketCount += 1;
  broadcastCount();
  res.json({ count: globalTicketCount });
});

wss.on("connection", (socket) => {
  socket.send(JSON.stringify({ count: globalTicketCount }));
});

server.listen(PORT, () => {
  console.log(`ever-greater-server listening on http://localhost:${PORT}`);
});
