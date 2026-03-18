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

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function randomRoomId() {
  return `room_${Math.random().toString(36).slice(2, 8)}`;
}

function sanitizeName(name) {
  return (name || "Player").trim() || "Player";
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
    interval: null,
  };
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

  const impulse =
    (-(1 + RESTITUTION) * velAlongNormal) / (1 / PLAYER_MASS + 1 / PLAYER_MASS);

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

function serializePlayers(playersMap) {
  return [...playersMap.values()].map((player) => ({
    id: player.id,
    name: player.name,
    position: player.position,
    velocity: player.velocity,
  }));
}

function createRoomService(io) {
  const rooms = new Map();

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
      players: serializePlayers(room.players),
    });
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

      if (
        player.position.x < -WORLD_HALF + PLAYER_RADIUS ||
        player.position.x > WORLD_HALF - PLAYER_RADIUS
      ) {
        player.position.x = clamp(
          player.position.x,
          -WORLD_HALF + PLAYER_RADIUS,
          WORLD_HALF - PLAYER_RADIUS
        );
        player.velocity.x *= -0.5;
      }

      if (
        player.position.z < -WORLD_HALF + PLAYER_RADIUS ||
        player.position.z > WORLD_HALF - PLAYER_RADIUS
      ) {
        player.position.z = clamp(
          player.position.z,
          -WORLD_HALF + PLAYER_RADIUS,
          WORLD_HALF - PLAYER_RADIUS
        );
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

  function createRoom(password) {
    const room = makeRoom(password);
    rooms.set(room.id, room);
    startRoomLoop(room);
    return room;
  }

  function getRoom(roomId) {
    return rooms.get(roomId);
  }

  function addPlayerToRoom(room, socketId, rawName) {
    const player = makePlayer(socketId, sanitizeName(rawName));
    spawnPlayerInRoom(room, player);
    room.players.set(socketId, player);
    return player;
  }

  function setPlayerInput(roomId, socketId, x, z) {
    const room = rooms.get(roomId);
    if (!room) {
      return;
    }

    const player = room.players.get(socketId);
    if (!player) {
      return;
    }

    player.input.x = clamp(Number(x) || 0, -1, 1);
    player.input.z = clamp(Number(z) || 0, -1, 1);
  }

  function removePlayer(roomId, socketId) {
    const room = rooms.get(roomId);
    if (!room) {
      return { room: null, player: null, removedRoom: false };
    }

    const player = room.players.get(socketId) || null;
    room.players.delete(socketId);

    if (room.players.size === 0) {
      removeRoom(roomId);
      return { room: null, player, removedRoom: true };
    }

    broadcastRoomState(room);
    return { room, player, removedRoom: false };
  }

  function isRoomPasswordValid(room, password) {
    return room.password === (password || "").trim();
  }

  function isRoomFull(room) {
    return room.players.size >= MAX_PLAYERS_PER_ROOM;
  }

  return {
    TICK_RATE,
    createRoom,
    getRoom,
    addPlayerToRoom,
    setPlayerInput,
    removePlayer,
    isRoomPasswordValid,
    isRoomFull,
    broadcastRoomState,
    getRoomCount: () => rooms.size,
  };
}

module.exports = {
  createRoomService,
};
