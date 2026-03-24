const {
  TICK_RATE,
  TICK_MS,
  MAX_PLAYERS_PER_ROOM,
  FALL_ELIMINATION_Y,
  PLATE_SURFACE_Y,
  SOLO_CPU_DIFFICULTY,
  SOLO_CPU_ID,
} = require("./constants");
const {
  clamp,
  sanitizeName,
  makePlayer,
  makeCPUball,
  makeRoom,
  placePlayerAtSpawnSlot,
  placePlayersForRound,
  resetPlayerForRound,
  stopPlayerHorizontalMovement,
  serializePlayers,
} = require("./player-utils");
const {
  resolveBallCollision,
  applyFalling,
  isPlayerOnPlate,
  applyMovementInput,
  capHorizontalSpeed,
  applyHorizontalFriction,
  advanceHorizontalPosition,
} = require("./physics-utils");



function normalizeAngle(angle) {
  let normalized = angle;

  while (normalized > Math.PI) {
    normalized -= Math.PI * 2;
  }

  while (normalized < -Math.PI) {
    normalized += Math.PI * 2;
  }

  return normalized;
}

function createRoomService(io) {
  const rooms = new Map();

  function normalizeSoloDifficulty(difficulty) {
    if (Object.hasOwn(SOLO_CPU_DIFFICULTY, difficulty)) {
      return difficulty;
    }

    return "medium";
  }

  function makeSoloOpponent(room) {
    const label = room.soloDifficulty === "dummy" ? "Dummy" : `CPU (${room.soloDifficulty})`;
    const cpu = makeCPUball(SOLO_CPU_ID, label);
    placePlayerAtSpawnSlot(cpu, 1);
    return cpu;
  }

  function getSoloDifficultyConfig(difficulty) {
    return SOLO_CPU_DIFFICULTY[difficulty] || SOLO_CPU_DIFFICULTY.medium;
  }

  function updateSoloCpuInput(room) {
    if (!room.solo || !room.roundInProgress) {
      return;
    }

    const cpu = room.players.get(SOLO_CPU_ID);
    if (!cpu || cpu.eliminated) {
      return;
    }

    const target = [...room.players.values()].find((player) => !player.isCpu && !player.eliminated);
    if (!target) {
      cpu.input.x = 0;
      cpu.input.z = 0;
      return;
    }

    const config = getSoloDifficultyConfig(room.soloDifficulty);
    const targetX = target.position.x + target.velocity.x * config.predictionTime;
    const targetZ = target.position.z + target.velocity.z * config.predictionTime;
    const dx = targetX - cpu.position.x;
    const dz = targetZ - cpu.position.z;
    const distance = Math.hypot(dx, dz);

    const desiredHeading = Math.atan2(dx, -dz);
    const headingDelta = normalizeAngle(desiredHeading - cpu.heading);
    const headingAbs = Math.abs(headingDelta);
    const baseTurn = clamp((headingDelta / (Math.PI / 3)) * config.turnGain, -1, 1);
    const wobble = Math.sin((room.tickCount || 0) * config.wobbleFreq) * config.wobbleAmp;
    cpu.input.x = clamp(baseTurn + wobble, -1, 1);

    const alignment = Math.max(0, Math.cos(headingAbs));
    let throttle = config.maxThrottle * (0.5 + Math.min(distance / 6, 0.5));

    if (headingAbs > 0.95) {
      throttle = config.pivotThrottle;
    }

    if (distance < config.brakeDistance) {
      throttle = config.brakeThrottle;
    }

    if (alignment > 0.92 && distance > 1.6) {
      throttle = config.maxThrottle;
    }

    throttle += alignment * config.chargeBoost;
    throttle = clamp(throttle, 0.16, config.maxThrottle);
    cpu.input.z = -throttle;
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

  function notifyWaitingForOpponent(room) {
    if (room.roundInProgress || room.players.size !== 1) {
      return;
    }

    io.to(room.id).emit("systemMessage", {
      message: "Waiting for opponent...",
    });
  }

  function emitRoundResult(player, result, message) {
    if (player.roundResult) {
      return;
    }

    player.roundResult = result;
    io.to(player.id).emit("roundResult", {
      result,
      message,
    });
  }

  function emitLoss(player) {
    emitRoundResult(player, "lost", "You lose!");
  }

  function emitWin(player) {
    emitRoundResult(player, "won", "You won!");
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
    stopPlayerHorizontalMovement(player);

    if (!player.isCpu) {
      emitLoss(player);
    }
    io.to(room.id).emit("systemMessage", {
      message: `${player.name} fell off the plate!`,
    });
  }

  function tickPlayer(room, player, dt) {
    if (player.eliminated) {
      applyFalling(player, dt);
      return;
    }

    applyMovementInput(player, dt);
    capHorizontalSpeed(player);
    applyHorizontalFriction(player);
    advanceHorizontalPosition(player, dt);

    if (!isPlayerOnPlate(player)) {
      stopPlayerHorizontalMovement(player);
      applyFalling(player, dt);

      if (player.position.y <= FALL_ELIMINATION_Y) {
        eliminatePlayer(room, player);
      }
      return;
    }

    player.position.y = PLATE_SURFACE_Y;
    player.fallVelocityY = 0;
  }

  function resolveActiveCollisions(players) {
    const activePlayers = players.filter((player) => !player.eliminated);

    for (let i = 0; i < activePlayers.length; i += 1) {
      for (let j = i + 1; j < activePlayers.length; j += 1) {
        resolveBallCollision(activePlayers[i], activePlayers[j]);
      }
    }
  }

  function tickRoom(room) {
    if (!room.roundInProgress) {
      return;
    }

    const players = [...room.players.values()];
    const dt = TICK_MS / 1000;
    room.tickCount = (room.tickCount || 0) + 1;

    updateSoloCpuInput(room);

    for (const player of players) {
      tickPlayer(room, player, dt);
    }

    resolveActiveCollisions(players);
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
    placePlayerAtSpawnSlot(player, room.players.size);
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
      resetPlayerForRound(player);
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

  function startSoloRound(room, difficulty = "medium") {
    if (room.roundInProgress) {
      return false;
    }

    room.solo = true;
    room.soloDifficulty = normalizeSoloDifficulty(difficulty);
    room.tickCount = 0;

    for (const player of room.players.values()) {
      resetPlayerForRound(player);
      placePlayerAtSpawnSlot(player, 0);
    }

    const soloOpponent = makeSoloOpponent(room);
    room.players.set(soloOpponent.id, soloOpponent);

    room.roundInProgress = true;
    io.to(room.id).emit("roundStarted", { roomId: room.id });
    io.to(room.id).emit("systemMessage", {
      message: `Solo — opponent: ${room.soloDifficulty}.`,
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

    if (room.solo) {
      const hasHumanPlayer = [...room.players.values()].some((currentPlayer) => !currentPlayer.isCpu);

      if (!hasHumanPlayer) {
        removeRoom(roomId);
        return { room: null, player, removedRoom: true };
      }
    }

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
    startSoloRound,
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
