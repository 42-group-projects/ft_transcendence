const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

// ─── Server Setup ────────────────────────────────────────────────────────────

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

const PORT = process.env.PORT || 3001;

// ─── Physics Constants ────────────────────────────────────────────────────────

const TICK_RATE   = 60;                      // Hz
const TICK_MS     = 1000 / TICK_RATE;        // ~16.67 ms per tick
const DT          = TICK_MS / 1000;          // delta-time in seconds

const MAT_HALF    = 5;                        // mat spans -5 to +5 on X and Z
const BALL_RADIUS = 0.5;
const BALL_MASS   = 1;

const GRAVITY     = 9.8;                      // m/s²  (applied when off mat)
const FRICTION    = 0.92;                     // velocity multiplier per tick (on mat)
const FORCE_MAG   = 18;                       // force applied per held key (m/s² equiv)
const RESTITUTION = 0.85;                     // elasticity of ball-to-ball collision

// ─── Game State ───────────────────────────────────────────────────────────────

function makeBall(x, z) {
  return {
    pos:  { x, y: BALL_RADIUS, z },           // y = resting on mat
    vel:  { x: 0, y: 0, z: 0 },
    onMat: true,
    fallen: false,
  };
}

function makeGameState() {
  return {
    balls:   [makeBall(-2, 0), makeBall(2, 0)],
    inputs:  [                                  // per-player input flags
      { up: false, down: false, left: false, right: false },
      { up: false, down: false, left: false, right: false },
    ],
    winner:  null,
    running: false,
  };
}

// Active rooms: roomId → { state, players: [socketId, socketId], interval }
const rooms = new Map();

// ─── Physics Engine ───────────────────────────────────────────────────────────

function applyInput(vel, input, idx) {
  // Player 0 faces +Z, Player 1 faces -Z (mirror controls feel natural)
  const dir = idx === 0 ? 1 : -1;

  if (input.up)    vel.z -= FORCE_MAG * dir * DT;
  if (input.down)  vel.z += FORCE_MAG * dir * DT;
  if (input.left)  vel.x -= FORCE_MAG * DT;
  if (input.right) vel.x += FORCE_MAG * DT;
}

function isOnMat(ball) {
  return (
    Math.abs(ball.pos.x) <= MAT_HALF &&
    Math.abs(ball.pos.z) <= MAT_HALF &&
    ball.pos.y <= BALL_RADIUS + 0.05
  );
}

function elasticCollision(a, b) {
  const dx = b.pos.x - a.pos.x;
  const dy = b.pos.y - a.pos.y;
  const dz = b.pos.z - a.pos.z;
  const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
  const minDist = BALL_RADIUS * 2;

  if (dist >= minDist || dist < 0.001) return;

  // Normalised collision axis
  const nx = dx / dist;
  const ny = dy / dist;
  const nz = dz / dist;

  // Relative velocity along collision normal
  const rvx = b.vel.x - a.vel.x;
  const rvy = b.vel.y - a.vel.y;
  const rvz = b.vel.z - a.vel.z;
  const vn = rvx * nx + rvy * ny + rvz * nz;

  // Already separating
  if (vn > 0) return;

  const impulse = -(1 + RESTITUTION) * vn / (1 / BALL_MASS + 1 / BALL_MASS);

  a.vel.x -= (impulse / BALL_MASS) * nx;
  a.vel.y -= (impulse / BALL_MASS) * ny;
  a.vel.z -= (impulse / BALL_MASS) * nz;
  b.vel.x += (impulse / BALL_MASS) * nx;
  b.vel.y += (impulse / BALL_MASS) * ny;
  b.vel.z += (impulse / BALL_MASS) * nz;

  // Positional correction – prevent sinking
  const overlap = (minDist - dist) / 2;
  a.pos.x -= overlap * nx;
  a.pos.y -= overlap * ny;
  a.pos.z -= overlap * nz;
  b.pos.x += overlap * nx;
  b.pos.y += overlap * ny;
  b.pos.z += overlap * nz;
}

function tickPhysics(state) {
  if (!state.running || state.winner) return;

  const [b0, b1] = state.balls;

  // 1. Apply player inputs
  for (let i = 0; i < 2; i++) {
    const ball = state.balls[i];
    if (!ball.fallen && ball.onMat) {
      applyInput(ball.vel, state.inputs[i], i);
    }
  }

  // 2. Update each ball
  for (let i = 0; i < 2; i++) {
    const ball = state.balls[i];

    if (ball.fallen) continue;

    // Gravity when off mat (or airborne)
    if (!ball.onMat) {
      ball.vel.y -= GRAVITY * DT;
    }

    // Integrate position
    ball.pos.x += ball.vel.x * DT;
    ball.pos.y += ball.vel.y * DT;
    ball.pos.z += ball.vel.z * DT;

    // Check if back on mat surface
    ball.onMat = isOnMat(ball);

    if (ball.onMat) {
      ball.pos.y = BALL_RADIUS;
      ball.vel.y = 0;
      // Friction only on mat
      ball.vel.x *= FRICTION;
      ball.vel.z *= FRICTION;
    }

    // Fallen off the world
    if (ball.pos.y < -5) {
      ball.fallen = true;
      state.winner = i === 0 ? 1 : 0;   // opponent wins
    }
  }

  // 3. Ball-to-ball elastic collision
  elasticCollision(b0, b1);
}

// ─── Room Management ─────────────────────────────────────────────────────────

function startGameLoop(roomId) {
  const room = rooms.get(roomId);
  if (!room) return;

  room.state.running = true;
  room.state.balls   = [makeBall(-2, 0), makeBall(2, 0)];
  room.state.winner  = null;

  room.interval = setInterval(() => {
    tickPhysics(room.state);

    io.to(roomId).emit('gameState', {
      balls:  room.state.balls,
      winner: room.state.winner,
    });

    if (room.state.winner !== null) {
      clearInterval(room.interval);
      room.state.running = false;
    }
  }, TICK_MS);
}

function stopGameLoop(roomId) {
  const room = rooms.get(roomId);
  if (room?.interval) {
    clearInterval(room.interval);
    room.interval = null;
  }
}

// ─── Socket Events ────────────────────────────────────────────────────────────

io.on('connection', (socket) => {
  console.log(`[+] Client connected: ${socket.id}`);

  socket.on('joinGame', () => {
    // Find a room with exactly 1 waiting player, or create a new one
    let roomId = null;
    for (const [id, room] of rooms) {
      if (room.players.length === 1 && !room.state.running) {
        roomId = id;
        break;
      }
    }

    if (!roomId) {
      roomId = `room_${Date.now()}`;
      rooms.set(roomId, {
        state:    makeGameState(),
        players:  [],
        interval: null,
      });
    }

    const room = rooms.get(roomId);
    const playerIdx = room.players.length;   // 0 or 1
    room.players.push(socket.id);

    socket.join(roomId);
    socket.data.roomId    = roomId;
    socket.data.playerIdx = playerIdx;

    socket.emit('playerAssigned', { playerIdx, roomId });
    console.log(`  Player ${playerIdx} joined room ${roomId}`);

    if (room.players.length === 2) {
      io.to(roomId).emit('gameStart', { message: 'Both players connected. Game starting!' });
      startGameLoop(roomId);
    } else {
      socket.emit('waiting', { message: 'Waiting for second player...' });
    }
  });

  // Input: { up, down, left, right } boolean flags sent every frame from client
  socket.on('input', (input) => {
    const { roomId, playerIdx } = socket.data;
    const room = rooms.get(roomId);
    if (!room) return;
    room.state.inputs[playerIdx] = input;
  });

  socket.on('restartGame', () => {
    const { roomId } = socket.data;
    const room = rooms.get(roomId);
    if (!room || room.players.length < 2) return;
    stopGameLoop(roomId);
    startGameLoop(roomId);
    io.to(roomId).emit('gameRestart');
  });

  socket.on('disconnect', () => {
    console.log(`[-] Client disconnected: ${socket.id}`);
    const { roomId } = socket.data;
    const room = rooms.get(roomId);
    if (!room) return;

    stopGameLoop(roomId);
    io.to(roomId).emit('opponentLeft', { message: 'Opponent disconnected.' });
    rooms.delete(roomId);
  });
});

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get('/health', (_, res) => res.json({ status: 'ok', tickRate: TICK_RATE }));

// ─── Start ────────────────────────────────────────────────────────────────────

server.listen(PORT, () => {
  console.log(`Socket.io game server running on port ${PORT} @ ${TICK_RATE} Hz`);
});
