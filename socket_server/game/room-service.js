const TICK_RATE = 60;
const TICK_MS = 1000 / TICK_RATE;
const WORLD_HALF = 11;
const PLAYER_RADIUS = 0.6;
const PLAYER_MASS = 1;
const MAX_PLAYERS_PER_ROOM = 8;
const ACCEL = 22;
const FRICTION = 0.88;
const MAX_SPEED = 9;
const RESTITUTION = 0.8;
const TURN_SPEED = 3.4;
const PLATE_RADIUS = WORLD_HALF;
const GRAVITY = 24;
const FALL_ELIMINATION_Y = -2;
const SPAWN_DISTANCE = 6;

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
    heading: 0,
    fallVelocityY: 0,
    isFalling: false,
    eliminated: false,
    roundResult: null,
  };
}

function makeRoom(password) {
  return {
    id: randomRoomId(),
    password,
    players: new Map(),
    interval: null,
    roundInProgress: false,
  };
}

function resolveBallCollision(a, b) {
  if (Math.abs(a.position.y - b.position.y) > PLAYER_RADIUS * 1.5) {
    return;
  }

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
    const angle = randomBetween(0, Math.PI * 2);
    const distance = Math.sqrt(Math.random()) * (PLATE_RADIUS - 2);
    const candidate = {
      x: Math.cos(angle) * distance,
      y: PLAYER_RADIUS,
      z: Math.sin(angle) * distance,
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

function placePlayersForRound(room) {
  const players = [...room.players.values()];

  players.forEach((player, index) => {
    const isNorthSide = index % 2 === 0;

    player.position = {
      x: 0,
      y: PLAYER_RADIUS,
      z: isNorthSide ? SPAWN_DISTANCE : -SPAWN_DISTANCE,
    };
    player.heading = isNorthSide ? 0 : Math.PI;
  });
}

function serializePlayers(playersMap) {
  return [...playersMap.values()].map((player) => ({
    id: player.id,
    name: player.name,
    position: player.position,
    velocity: player.velocity,
    heading: player.heading,
    eliminated: player.eliminated,
  }));
}

function createRoomService(io) {
  const rooms = new Map();

  function resetPlayerForRound(room, player) {
    player.velocity.x = 0;
    player.velocity.z = 0;
    player.input.x = 0;
    player.input.z = 0;
    player.fallVelocityY = 0;
    player.isFalling = false;
    player.position.y = PLAYER_RADIUS;
    player.eliminated = false;
    player.roundResult = null;
  }

  function applyFalling(player, dt) {
    player.fallVelocityY -= GRAVITY * dt;
    player.position.y += player.fallVelocityY * dt;
  }

  function notifyWaitingForOpponent(room) {
    if (room.roundInProgress || room.players.size !== 1) {
      return;
    }

    io.to(room.id).emit("systemMessage", {
      message: "Waiting for opponent...",
    });
  }

  function emitLoss(player) {
    if (player.roundResult) {
      return;
    }

    player.roundResult = "lost";
    io.to(player.id).emit("roundResult", {
      result: "lost",
      message: "You lose!",
    });
  }

  function emitWin(player) {
    if (player.roundResult) {
      return;
    }

    player.roundResult = "won";
    io.to(player.id).emit("roundResult", {
      result: "won",
      message: "You won!",
    });
  }

  function endRoundIfNeeded(room) {
    if (!room.roundInProgress) {
      return;
    }

    const alivePlayers = [...room.players.values()].filter((player) => !player.eliminated);

    if (alivePlayers.length > 1) {
      return;
    }

    room.roundInProgress = false;

    if (alivePlayers.length === 1) {
      const winner = alivePlayers[0];
      emitWin(winner);
      io.to(room.id).emit("systemMessage", {
        message: `${winner.name} is the winner!`,
      });
      return;
    }

    io.to(room.id).emit("systemMessage", {
      message: "Round ended with no winner.",
    });
  }

  function eliminatePlayer(room, player) {
    if (player.eliminated) {
      return;
    }

    player.eliminated = true;
    player.input.x = 0;
    player.input.z = 0;
    player.velocity.x = 0;
    player.velocity.z = 0;

    emitLoss(player);
    io.to(room.id).emit("systemMessage", {
      message: `${player.name} fell off the plate!`,
    });
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
      players: serializePlayers(room.players),
    });
  }

  function tickRoom(room) {
    if (!room.roundInProgress) {
      return;
    }

    const players = [...room.players.values()];
    const dt = TICK_MS / 1000;

    for (const player of players) {
      if (player.eliminated) {
        applyFalling(player, dt);
        continue;
      }

      player.heading += player.input.x * TURN_SPEED * dt;

      const throttle = -player.input.z;
      const forwardX = Math.sin(player.heading);
      const forwardZ = -Math.cos(player.heading);

      player.velocity.x += forwardX * throttle * ACCEL * dt;
      player.velocity.z += forwardZ * throttle * ACCEL * dt;

      const speed = Math.hypot(player.velocity.x, player.velocity.z);
      if (speed > MAX_SPEED) {
        const scale = MAX_SPEED / speed;
        player.velocity.x *= scale;
        player.velocity.z *= scale;
      }

      player.velocity.x *= FRICTION;
      player.velocity.z *= FRICTION;

      player.position.x += player.velocity.x * dt;
      player.position.z += player.velocity.z * dt;

      const distanceFromCenter = Math.hypot(player.position.x, player.position.z);
      const onPlate = distanceFromCenter <= PLATE_RADIUS - PLAYER_RADIUS;

      if (!onPlate) {
        player.isFalling = true;
        player.input.x = 0;
        player.input.z = 0;
        applyFalling(player, dt);

        if (player.position.y <= FALL_ELIMINATION_Y) {
          eliminatePlayer(room, player);
        }

        continue;
      }

      player.isFalling = false;
      player.position.y = PLAYER_RADIUS;
      player.fallVelocityY = 0;
    }

    const activePlayers = players.filter((player) => !player.eliminated);
    for (let i = 0; i < activePlayers.length; i += 1) {
      for (let j = i + 1; j < activePlayers.length; j += 1) {
        resolveBallCollision(activePlayers[i], activePlayers[j]);
      }
    }

    endRoundIfNeeded(room);

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

    if (!room.roundInProgress || player.eliminated) {
      player.input.x = 0;
      player.input.z = 0;
      return;
    }

    player.input.x = clamp(Number(x) || 0, -1, 1);
    player.input.z = clamp(Number(z) || 0, -1, 1);
  }

  function tryStartRound(room) {
    if (room.roundInProgress || room.players.size < 2) {
      return false;
    }

    for (const player of room.players.values()) {
      resetPlayerForRound(room, player);
    }

    placePlayersForRound(room);

    room.roundInProgress = true;
    io.to(room.id).emit("roundStarted", { roomId: room.id });
    io.to(room.id).emit("systemMessage", {
      message: "Round started! Last player on the plate wins.",
    });
    broadcastRoomState(room);
    return true;
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

    endRoundIfNeeded(room);
    return { room, player, removedRoom: false };
  }

  function isRoomPasswordValid(room, password) {
    return room.password === (password || "").trim();
  }

  function isRoomFull(room) {
    return room.players.size >= MAX_PLAYERS_PER_ROOM;
  }

  function isRoundInProgress(room) {
    return room.roundInProgress;
  }

  return {
    TICK_RATE,
    createRoom,
    getRoom,
    addPlayerToRoom,
    setPlayerInput,
    tryStartRound,
    removePlayer,
    isRoomPasswordValid,
    isRoomFull,
    isRoundInProgress,
    notifyWaitingForOpponent,
    broadcastRoomState,
    getRoomCount: () => rooms.size,
  };
}

module.exports = {
  createRoomService,
};
