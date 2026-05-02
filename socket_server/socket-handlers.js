const {
  PLAYER_RADIUS,
  SPAWN_DISTANCE,
  WORLD_HALF,
  DASH_COOLDOWN_MS,
} = require("./game/constants");
const presenceManager = require("./presence-manager"); //プレゼンスマネージャーを読み込む

function registerSocketHandlers(io, roomService) {
  io.on("connection", (socket) => {
    const userId = socket.data.userId;

    // 接続されたら「オンライン」として登録し、全員に通知
    if (userId) {
      presenceManager.markUserOnline(userId);
      io.to(`presence_${userId}`).emit("user_status_changed", {
        userId,
        status: "online",
      });
    }

    // フロントエンドが指定したフレンドたちの今の状態を教えて、と聞いてきた時の処理
    socket.on("get_users_status", (userIds, callback) => {
      if (Array.isArray(userIds) && typeof callback === "function") {
        // このユーザーが知りたい相手の「専用Room」にすべて参加(Join)させる
        userIds.forEach((id) => {
          socket.join(`presence_${id}`); // 例: "presence_ed193ec9..." という部屋
        });

        const statuses = presenceManager.getMultipleUsersStatus(userIds);
        callback(statuses);
      }
    });

    socket.emit("gameConstants", {
      PLAYER_RADIUS,
      SPAWN_DISTANCE,
      WORLD_HALF,
      DASH_COOLDOWN_MS,
    });

    const reconnectResult = roomService.reconnectPlayer(userId, socket.id);
    if (reconnectResult.ok && reconnectResult.room) {
      socket.join(reconnectResult.room.id);
      socket.data.roomId = reconnectResult.room.id;

      // 再接続でゲームに戻ったら「ゲーム中」にする
      presenceManager.markUserInGame(userId);
      io.to(`presence_${userId}`).emit("user_status_changed", {
        userId,
        status: "in_game",
      });

      socket.emit("joinedRoom", {
        roomId: reconnectResult.room.id,
        playerId: reconnectResult.player.userId,
      });
      socket.emit("systemMessage", {
        message: "Reconnected to active session.",
      });
    }

    socket.on("createRoom", ({ password, name }) => {
      const trimmedPassword = (password || "").trim();
      if (!trimmedPassword) {
        socket.emit("roomError", {
          message: "Password is required to create a room.",
        });
        return;
      }

      const room = roomService.createRoom(trimmedPassword);

      socket.emit("roomCreated", { roomId: room.id });
      socket.emit("systemMessage", { message: `Room created: ${room.id}` });

      const player = roomService.addPlayerToRoom(room, {
        userId,
        socketId: socket.id,
        rawName: name,
      });

      socket.join(room.id);
      socket.data.roomId = room.id;

      // ルームに入ったら「ゲーム中」にする
      presenceManager.markUserInGame(userId);
      io.to(`presence_${userId}`).emit("user_status_changed", {
        userId,
        status: "in_game",
      });

      socket.emit("joinedRoom", { roomId: room.id, playerId: player.userId });
      roomService.broadcastRoomState(room);

      const started = roomService.tryStartRound(room);
      if (!started) {
        roomService.notifyWaitingForOpponent(room);
      }
    });

    const handleJoinRoom = ({ roomId, password, name }) => {
      const room = roomService.getRoom((roomId || "").trim());

      if (!room) {
        socket.emit("roomError", { message: "Room not found." });
        return;
      }

      if (room.solo) {
        socket.emit("roomError", { message: "Room not found." });
        return;
      }

      if (!roomService.isRoomPasswordValid(room, password)) {
        socket.emit("roomError", { message: "Incorrect room password." });
        return;
      }

      if (roomService.isRoomFull(room)) {
        socket.emit("roomError", { message: "Room is full." });
        return;
      }

      const player = roomService.addPlayerToRoom(room, {
        userId,
        socketId: socket.id,
        rawName: name,
      });

      socket.join(room.id);
      socket.data.roomId = room.id;

      // ルームに入ったら「ゲーム中」にする
      presenceManager.markUserInGame(userId);
      io.to(`presence_${userId}`).emit("user_status_changed", {
        userId,
        status: "in_game",
      });

      socket.emit("joinedRoom", { roomId: room.id, playerId: player.userId });
      socket.emit("systemMessage", { message: `Joined room: ${room.id}` });
      io.to(room.id).emit("systemMessage", {
        message: `${player.name} joined.`,
      });

      roomService.broadcastRoomState(room);
      const started = roomService.tryStartRound(room);

      if (!started) {
        roomService.notifyWaitingForOpponent(room);
      }
    };

    socket.on("join", handleJoinRoom);
    socket.on("joinRoom", handleJoinRoom);

    socket.on("soloStart", ({ name, difficulty }) => {
      if (socket.data.roomId) {
        return;
      }

      const soloPassword =
        Math.random().toString(36).slice(2) +
        Math.random().toString(36).slice(2);
      const room = roomService.createRoom(soloPassword);

      const player = roomService.addPlayerToRoom(room, {
        userId,
        socketId: socket.id,
        rawName: name,
      });

      socket.join(room.id);
      socket.data.roomId = room.id;

      // ソロプレイ開始時も「ゲーム中」にする
      presenceManager.markUserInGame(userId);
      io.to(`presence_${userId}`).emit("user_status_changed", {
        userId,
        status: "in_game",
      });

      socket.emit("joinedRoom", { roomId: room.id, playerId: player.userId });
      socket.emit("systemMessage", {
        message: `Solo room created: ${room.id}`,
      });

      roomService.startSoloRound(room, difficulty);
    });

    socket.on("move", ({ x, z }) => {
      const roomId = socket.data.roomId;
      if (!roomId) return;
      roomService.setPlayerInput(roomId, userId, x, z);
    });

    socket.on("dash", () => {
      const roomId = socket.data.roomId;
      if (!roomId) return;
      if (typeof roomService.handlePlayerDash === "function") {
        roomService.handlePlayerDash(roomId, userId);
      }
    });

    socket.on("moveInput", ({ x, z }) => {
      const roomId = socket.data.roomId;
      if (!roomId) return;
      roomService.setPlayerInput(roomId, userId, x, z);
    });

    socket.on("reconnect", () => {
      const result = roomService.reconnectPlayer(userId, socket.id);
      if (!result.ok || !result.room) return;

      socket.join(result.room.id);
      socket.data.roomId = result.room.id;

      // 再接続成功時
      presenceManager.markUserInGame(userId);
      io.to(`presence_${userId}`).emit("user_status_changed", {
        userId,
        status: "in_game",
      });

      socket.emit("joinedRoom", {
        roomId: result.room.id,
        playerId: result.player.userId,
      });
    });

    socket.on("leaveRoom", () => {
      const roomId = socket.data.roomId;
      if (!roomId) return;

      const result = roomService.handleLeave(roomId, userId);

      socket.leave(roomId);
      socket.data.roomId = null;

      // ルームを抜けたら「オンライン（待機中）」に戻す
      presenceManager.markUserOnline(userId);
      io.to(`presence_${userId}`).emit("user_status_changed", {
        userId,
        status: "online",
      });

      if (result.player) {
        io.to(roomId).emit("systemMessage", {
          message: `${result.player.name} left.`,
        });
      }

      if (result.room) {
        roomService.broadcastRoomState(result.room);
        roomService.notifyWaitingForOpponent(result.room);
      }
    });

    socket.on("disconnect", () => {
      // 切断されたら「オフライン」として登録し、全員に通知
      if (userId) {
        presenceManager.markUserOffline(userId);
        io.to(`presence_${userId}`).emit("user_status_changed", {
          userId,
          status: "offline",
        });
      }

      const roomId = socket.data.roomId;
      if (!roomId) return;

      const result = roomService.handleDisconnect(roomId, userId);
      if (!result.player || !result.room) return;

      roomService.broadcastRoomState(result.room);
    });
  });
}

module.exports = {
  registerSocketHandlers,
};
