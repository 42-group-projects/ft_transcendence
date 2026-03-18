const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const { PORT, SOCKET_CORS } = require("./config");
const { createRoomService } = require("./game/room-service");
const { registerSocketHandlers } = require("./socket-handlers");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: SOCKET_CORS,
});

const roomService = createRoomService(io);

registerSocketHandlers(io, roomService);

app.get("/health", (_, res) => {
  res.json({
    status: "ok",
    tickRate: roomService.TICK_RATE,
    rooms: roomService.getRoomCount(),
  });
});

server.listen(PORT, () => {
  console.log(`Socket server running on :${PORT}`);
});
