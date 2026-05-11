const { RECONNECT_GRACE_MS } = require("../config");
const { stopPlayerHorizontalMovement } = require("./player-utils");

function createRoomSessionManager({
  io,
  rooms,
  userSessions,
  removeRoom,
  emitGameState,
  findRoomByUserId,
  hasDisconnectedHuman,
  handleLeave,
  presenceManager,
  saveMatchResult,
}) {
  function clearReconnectTimer(room, userId) {
    const timeoutId = room.reconnectTimeouts.get(userId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      room.reconnectTimeouts.delete(userId);
    }
  }

  function clearAllReconnectTimers(room) {
    for (const timeoutId of room.reconnectTimeouts.values()) {
      clearTimeout(timeoutId);
    }

    room.reconnectTimeouts.clear();
  }

  function removeSocketsFromRoom(room) {
    for (const player of room.players.values()) {
      if (player.isCpu || !player.socketId) {
        continue;
      }

      const socket = io.sockets.sockets.get(player.socketId);
      if (!socket) {
        continue;
      }

      socket.leave(room.id);
      socket.data.roomId = null;
    }
  }

  function endSession(room, { reason, message, payload = {} }) {
    if (!rooms.has(room.id)) {
      return;
    }

    room.roundInProgress = false;
    room.paused = false;

    io.to(room.id).emit("session_ended", {
      reason,
      message,
      ...payload,
    });

    if (message) {
      io.to(room.id).emit("systemMessage", { message });
    }

    // Persist match result when a game finishes with a clear winner
    if (reason === "game_finished" && payload.winnerId && saveMatchResult) {
      saveMatchResult(room, payload.winnerId).catch((err) => {
        console.error("[endSession] saveMatchResult failed", err);
      });
    }

    // セッション終了時、まだ接続中の人間プレイヤーのみオンラインに戻す。
    // 既にdisconnectしたプレイヤーはofflineのままにする。
    if (presenceManager) {
      for (const player of room.players.values()) {
        if (player.isCpu) {
          continue;
        }

        const isStillConnected = !player.disconnected && player.socketId && io.sockets.sockets.has(player.socketId);

        if (isStillConnected) {
          presenceManager.markUserOnline(player.userId);
          io.to(`presence_${player.userId}`).emit("user_status_changed", {
            userId: player.userId,
            status: "online",
          });
        }
      }
    }

    removeSocketsFromRoom(room);
    removeRoom(room.id);
  }

  function endSessionForDisconnectTimeout(room, disconnectedUserId) {
    if (!rooms.has(room.id) || !room.roundInProgress) {
      return;
    }

    endSession(room, {
      reason: "disconnect_timeout",
      message: "Session ended because a player did not reconnect in time.",
      payload: { userId: disconnectedUserId },
    });
  }

  function scheduleReconnectTimeout(room, userId) {
    clearReconnectTimer(room, userId);

    const timeoutId = setTimeout(() => {
      endSessionForDisconnectTimeout(room, userId);
    }, RECONNECT_GRACE_MS);

    room.reconnectTimeouts.set(userId, timeoutId);
  }

  function runResumeCountdown(room) {
    let secondsRemaining = 3;

    const countdownTick = () => {
      io.to(room.id).emit("countdown", {
        secondsRemaining,
        reason: "reconnect_resume",
      });

      if (secondsRemaining === 0) {
        room.paused = false;
        io.to(room.id).emit("systemMessage", {
          message: "Match resumed.",
        });
        emitGameState(room);
        return;
      }

      secondsRemaining -= 1;
      setTimeout(countdownTick, 1000);
    };

    countdownTick();
  }

  function handleDisconnect(roomId, userId) {
    const room = rooms.get(roomId);
    if (!room) {
      return { room: null, player: null, removedRoom: false };
    }

    const player = room.players.get(userId);
    if (!player) {
      return { room, player: null, removedRoom: false };
    }

    if (room.solo) {
      return handleLeave(roomId, userId);
    }

    const previousSocketId = player.socketId;
    player.disconnected = true;
    player.socketId = null;

    if (previousSocketId) {
      room.playerBySocketId.delete(previousSocketId);
    }

    stopPlayerHorizontalMovement(player);
    room.paused = room.roundInProgress;

    io.to(room.id).emit("opponent_disconnected", {
      userId,
      timeoutMs: RECONNECT_GRACE_MS,
    });

    io.to(room.id).emit("systemMessage", {
      message: `${player.name} disconnected. Match paused.`,
    });

    emitGameState(room);

    if (room.roundInProgress) {
      scheduleReconnectTimeout(room, userId);
    }

    return { room, player, removedRoom: false };
  }

  function reconnectPlayer(userId, socketId) {
    const room = findRoomByUserId(userId);
    if (!room) {
      return { ok: false, room: null, player: null };
    }

    const player = room.players.get(userId);
    if (!player) {
      return { ok: false, room: null, player: null };
    }

    if (player.socketId) {
      room.playerBySocketId.delete(player.socketId);
    }

    player.socketId = socketId;
    player.disconnected = false;
    room.playerBySocketId.set(socketId, userId);

    clearReconnectTimer(room, userId);

    io.to(room.id).emit("opponent_reconnected", { userId });
    emitGameState(room);

    if (room.roundInProgress && room.paused && !hasDisconnectedHuman(room)) {
      runResumeCountdown(room);
    }

    return { ok: true, room, player };
  }

  return {
    clearReconnectTimer,
    clearAllReconnectTimers,
    endSession,
    handleDisconnect,
    reconnectPlayer,
  };
}

module.exports = {
  createRoomSessionManager,
};
