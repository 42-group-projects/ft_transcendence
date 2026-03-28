const {
  TICK_MS,
  FALL_ELIMINATION_Y,
  PLATE_SURFACE_Y,
  SOLO_CPU_ID,
} = require("./constants");
const {
  clamp,
  placePlayerAtSpawnSlot,
  placePlayersForRound,
  resetPlayerForRound,
  stopPlayerHorizontalMovement,
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

const { sanitizePlayerNumbers } = require("./player-utils");

const GAME_FINISH_REASON = "game_finished";

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

function createRoomRoundManager({
  io,
  emitGameState,
  countHumanPlayers,
  normalizeSoloDifficulty,
  makeSoloOpponent,
  getSoloDifficultyConfig,
  endSession,
}) {
  function notifyWaitingForOpponent(room) {
    if (room.roundInProgress || countHumanPlayers(room) !== 1) {
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

    if (player.socketId) {
      io.to(player.socketId).emit("result", { result, message });
      io.to(player.socketId).emit("roundResult", { result, message });
    }
  }

  function emitLoss(player) {
    emitRoundResult(player, "lost", "You lose!");
  }

  function emitWin(player) {
    emitRoundResult(player, "won", "You won!");
  }

  function endRoundIfNeeded(room) {
    if (!room.roundInProgress || room.paused) {
      return false;
    }

    const alivePlayers = [...room.players.values()].filter((player) => !player.eliminated);

    if (alivePlayers.length > 1) {
      return false;
    }

    if (alivePlayers.length === 1) {
      const winner = alivePlayers[0];
      emitWin(winner);
      endSession(room, {
        reason: GAME_FINISH_REASON,
        message: `${winner.name} is the winner!`,
      });
      return true;
    }

    endSession(room, {
      reason: GAME_FINISH_REASON,
      message: "Round ended with no winner.",
    });
    return true;
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
    // sanitize numbers early to prevent NaN from spreading through physics
    sanitizePlayerNumbers(player);
    if (player.disconnected) {
      stopPlayerHorizontalMovement(player);
      return;
    }

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
    const activePlayers = players.filter((player) => !player.eliminated && !player.disconnected);

    for (let index = 0; index < activePlayers.length; index += 1) {
      for (let comparisonIndex = index + 1; comparisonIndex < activePlayers.length; comparisonIndex += 1) {
        resolveBallCollision(activePlayers[index], activePlayers[comparisonIndex]);
      }
    }
  }

  function updateSoloCpuInput(room) {
    if (!room.solo || !room.roundInProgress || room.paused) {
      return;
    }

    const cpu = room.players.get(SOLO_CPU_ID);
    if (!cpu || cpu.eliminated) {
      return;
    }

    const target = [...room.players.values()].find(
      (player) => !player.isCpu && !player.eliminated && !player.disconnected
    );

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

  function tickRoom(room) {
    if (!room.roundInProgress) {
      return;
    }

    if (room.paused) {
      emitGameState(room);
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

    if (endRoundIfNeeded(room)) {
      return;
    }

    emitGameState(room);
  }

  function tryStartRound(room) {
    if (room.roundInProgress || countHumanPlayers(room) < 2) {
      return false;
    }

    for (const player of room.players.values()) {
      resetPlayerForRound(player);
    }

    placePlayersForRound(room);
    room.tickCount = 0;
    room.paused = false;

    // Countdown sequence before round starts
    let secondsRemaining = 3;
    const countdownTick = () => {
      io.to(room.id).emit("countdown", { secondsRemaining, reason: "round_start" });
      if (secondsRemaining === 0) {
        room.roundInProgress = true;
        io.to(room.id).emit("roundStarted", { roomId: room.id });
        io.to(room.id).emit("systemMessage", {
          message: "Round started! Last player on the plate wins.",
        });
        emitGameState(room);
        return;
      }
      secondsRemaining -= 1;
      setTimeout(countdownTick, 1000);
    };
    countdownTick();
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

    room.paused = false;

    // Countdown sequence before solo round starts
    let secondsRemaining = 3;
    const countdownTick = () => {
      io.to(room.id).emit("countdown", { secondsRemaining, reason: "round_start" });
      if (secondsRemaining === 0) {
        room.roundInProgress = true;
        io.to(room.id).emit("roundStarted", { roomId: room.id });
        io.to(room.id).emit("systemMessage", {
          message: `Solo — opponent: ${room.soloDifficulty}.`,
        });
        emitGameState(room);
        return;
      }
      secondsRemaining -= 1;
      setTimeout(countdownTick, 1000);
    };
    countdownTick();
    return true;
  }

  return {
    endRoundIfNeeded,
    notifyWaitingForOpponent,
    startSoloRound,
    tickRoom,
    tryStartRound,
  };
}

module.exports = {
  createRoomRoundManager,
};
