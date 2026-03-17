const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

const PORT = process.env.PORT || 3001;

const TICK_RATE = 60;
const TICK_MS = 1000 / TICK_RATE;
const WORLD_HALF = 14;
const PLAYER_RADIUS = 0.6;
const PLAYER_MASS = 1;
const MAX_PLAYERS_PER_ROOM = 8;
const ACCEL = 22;
const FRICTION = 0.88;
const MAX_SPEED = 9;
const RESTITUTION = 0.8;

const rooms = new Map();

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function randomRoomId() {
  return `room_${Math.random().toString(36).slice(2, 8)}`;
}

function makePlayer(id, name) {
  return {
    id,
    name,
    position: { x: 0, y: PLAYER_RADIUS, z: 0 },
    velocity: { x: 0, z: 0 },
    input: { x: 0, z: 0 },
  };
}

function makeRoom(password) {
  return {
    id: randomRoomId(),
    password,
    players: new Map(),
    running: true,
    interval: null,
  };
}

function spawnPlayerInRoom(room, player) {
  let position = { x: 0, y: PLAYER_RADIUS, z: 0 };

  for (let attempt = 0; attempt < 50; attempt += 1) {
    const candidate = {
      x: randomBetween(-WORLD_HALF + 2, WORLD_HALF - 2),
      y: PLAYER_RADIUS,
      z: randomBetween(-WORLD_HALF + 2, WORLD_HALF - 2),
    };

    let overlaps = false;
    for (const other of room.players.values()) {
      const dx = candidate.x - other.position.x;
      const dz = candidate.z - other.position.z;
      const d2 = dx * dx + dz * dz;
      if (d2 < (PLAYER_RADIUS * 2.5) ** 2) {
        overlaps = true;
        break;
      }
    }

    if (!overlaps) {
      position = candidate;
      break;
    }
  }

  player.position = position;
}

function removeRoom(roomId) {
  const room = rooms.get(roomId);
  if (!room) {
    return;
  }

  if (room.interval) {
    clearInterval(room.interval);
  }

  rooms.delete(roomId);
}

function broadcastRoomState(room) {
  io.to(room.id).emit("roomState", {
    roomId: room.id,
    players: [...room.players.values()].map((player) => ({
      id: player.id,
      name: player.name,
      position: player.position,
      velocity: player.velocity,
    })),
  });
}

function resolveBallCollision(a, b) {
  const dx = b.position.x - a.position.x;
  const dz = b.position.z - a.position.z;
  const dist = Math.sqrt(dx * dx + dz * dz);
  const minDist = PLAYER_RADIUS * 2;

  if (dist >= minDist || dist < 0.0001) {
    return;
  }

  const nx = dx / dist;
  const nz = dz / dist;

  const rvx = b.velocity.x - a.velocity.x;
  const rvz = b.velocity.z - a.velocity.z;
  const velAlongNormal = rvx * nx + rvz * nz;

  if (velAlongNormal > 0) {
    return;
  }

  const impulse = -(1 + RESTITUTION) * velAlongNormal / (1 / PLAYER_MASS + 1 / PLAYER_MASS);

  a.velocity.x -= (impulse / PLAYER_MASS) * nx;
  a.velocity.z -= (impulse / PLAYER_MASS) * nz;
  b.velocity.x += (impulse / PLAYER_MASS) * nx;
  b.velocity.z += (impulse / PLAYER_MASS) * nz;

  const overlap = (minDist - dist) / 2;
  a.position.x -= overlap * nx;
  a.position.z -= overlap * nz;
  b.position.x += overlap * nx;
  b.position.z += overlap * nz;
}

function tickRoom(room) {
  const players = [...room.players.values()];

  for (const player of players) {
    player.velocity.x += player.input.x * ACCEL * (TICK_MS / 1000);
    player.velocity.z += player.input.z * ACCEL * (TICK_MS / 1000);

    const speed = Math.hypot(player.velocity.x, player.velocity.z);
    if (speed > MAX_SPEED) {
      const scale = MAX_SPEED / speed;
      player.velocity.x *= scale;
      player.velocity.z *= scale;
    }

    player.velocity.x *= FRICTION;
    player.velocity.z *= FRICTION;

    player.position.x += player.velocity.x * (TICK_MS / 1000);
    player.position.z += player.velocity.z * (TICK_MS / 1000);

    if (player.position.x < -WORLD_HALF + PLAYER_RADIUS || player.position.x > WORLD_HALF - PLAYER_RADIUS) {
      player.position.x = clamp(player.position.x, -WORLD_HALF + PLAYER_RADIUS, WORLD_HALF - PLAYER_RADIUS);
      player.velocity.x *= -0.5;
    }

    if (player.position.z < -WORLD_HALF + PLAYER_RADIUS || player.position.z > WORLD_HALF - PLAYER_RADIUS) {
      player.position.z = clamp(player.position.z, -WORLD_HALF + PLAYER_RADIUS, WORLD_HALF - PLAYER_RADIUS);
      player.velocity.z *= -0.5;
    }
  }

  for (let i = 0; i < players.length; i += 1) {
    for (let j = i + 1; j < players.length; j += 1) {
      resolveBallCollision(players[i], players[j]);
    }
  }

  broadcastRoomState(room);
}

function startRoomLoop(room) {
  if (room.interval) {
    clearInterval(room.interval);
  }

  room.interval = setInterval(() => {
    tickRoom(room);
  }, TICK_MS);
}

io.on("connection", (socket) => {
  socket.on("createRoom", ({ password, name }) => {
    const trimmedPassword = (password || "").trim();
    if (!trimmedPassword) {
      socket.emit("roomError", { message: "Password is required to create a room." });
      return;
    }

    const room = makeRoom(trimmedPassword);
    rooms.set(room.id, room);
    startRoomLoop(room);

    socket.emit("roomCreated", { roomId: room.id });
    socket.emit("systemMessage", { message: `Room created: ${room.id}` });

    const player = makePlayer(socket.id, (name || "Player").trim() || "Player");
    spawnPlayerInRoom(room, player);
    room.players.set(socket.id, player);

    socket.join(room.id);
    socket.data.roomId = room.id;

    socket.emit("joinedRoom", { roomId: room.id, playerId: socket.id });
    broadcastRoomState(room);
  });

  socket.on("joinRoom", ({ roomId, password, name }) => {
    const room = rooms.get((roomId || "").trim());

    if (!room) {
      socket.emit("roomError", { message: "Room not found." });
      return;
    }

    if (room.password !== (password || "").trim()) {
      socket.emit("roomError", { message: "Incorrect room password." });
      return;
    }

    if (room.players.size >= MAX_PLAYERS_PER_ROOM) {
      socket.emit("roomError", { message: "Room is full." });
      return;
    }

    const player = makePlayer(socket.id, (name || "Player").trim() || "Player");
    spawnPlayerInRoom(room, player);
    room.players.set(socket.id, player);

    socket.join(room.id);
    socket.data.roomId = room.id;

    socket.emit("joinedRoom", { roomId: room.id, playerId: socket.id });
    socket.emit("systemMessage", { message: `Joined room: ${room.id}` });
    io.to(room.id).emit("systemMessage", { message: `${player.name} joined.` });

    broadcastRoomState(room);
  });

  socket.on("moveInput", ({ x, z }) => {
    const roomId = socket.data.roomId;
    if (!roomId) {
      return;
    }

    const room = rooms.get(roomId);
    if (!room) {
      return;
    }

    const player = room.players.get(socket.id);
    if (!player) {
      return;
    }

    player.input.x = clamp(Number(x) || 0, -1, 1);
    player.input.z = clamp(Number(z) || 0, -1, 1);
  });

  socket.on("leaveRoom", () => {
    const roomId = socket.data.roomId;
    if (!roomId) {
      return;
    }

    const room = rooms.get(roomId);
    if (!room) {
      socket.data.roomId = null;
      return;
    }

    const leavingPlayer = room.players.get(socket.id);
    room.players.delete(socket.id);
    socket.leave(roomId);
    socket.data.roomId = null;

    if (leavingPlayer) {
      io.to(roomId).emit("systemMessage", { message: `${leavingPlayer.name} left.` });
    }

    if (room.players.size === 0) {
      removeRoom(roomId);
      return;
    }

    broadcastRoomState(room);
  });

  socket.on("disconnect", () => {
    const roomId = socket.data.roomId;
    if (!roomId) {
      return;
    }

    const room = rooms.get(roomId);
    if (!room) {
      return;
    }

    const leavingPlayer = room.players.get(socket.id);
    room.players.delete(socket.id);

    if (leavingPlayer) {
      io.to(roomId).emit("systemMessage", { message: `${leavingPlayer.name} disconnected.` });
    }

    if (room.players.size === 0) {
      removeRoom(roomId);
      return;
    }

    broadcastRoomState(room);
  });
});

app.get("/health", (_, res) => {
  res.json({
    status: "ok",
    tickRate: TICK_RATE,
    rooms: rooms.size,
  });
});

server.listen(PORT, () => {
  console.log(`Socket server running on :${PORT}`);
});
