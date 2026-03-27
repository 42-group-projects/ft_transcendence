const { PLAYER_RADIUS, SPAWN_DISTANCE, WORLD_HALF } = require("./game/constants");

function registerSocketHandlers(io, roomService) {
  io.on("connection", (socket) => {
    const userId = socket.data.userId;

    socket.emit("gameConstants", {
      PLAYER_RADIUS,
      SPAWN_DISTANCE,
      WORLD_HALF,
    });

    const reconnectResult = roomService.reconnectPlayer(userId, socket.id);
    if (reconnectResult.ok && reconnectResult.room) {
      socket.join(reconnectResult.room.id);
      socket.data.roomId = reconnectResult.room.id;
      socket.emit("joinedRoom", {
        roomId: reconnectResult.room.id,
        playerId: reconnectResult.player.userId,
      });
      socket.emit("systemMessage", { message: "Reconnected to active session." });
    }

    socket.on("createRoom", ({ password, name }) => {
      const trimmedPassword = (password || "").trim();
      if (!trimmedPassword) {
        socket.emit("roomError", { message: "Password is required to create a room." });
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

      socket.emit("joinedRoom", { roomId: room.id, playerId: player.userId });
      socket.emit("systemMessage", { message: `Joined room: ${room.id}` });
      io.to(room.id).emit("systemMessage", { message: `${player.name} joined.` });

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

      const soloPassword = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
      const room = roomService.createRoom(soloPassword);

      const player = roomService.addPlayerToRoom(room, {
        userId,
        socketId: socket.id,
        rawName: name,
      });

      socket.join(room.id);
      socket.data.roomId = room.id;

      socket.emit("joinedRoom", { roomId: room.id, playerId: player.userId });
      socket.emit("systemMessage", { message: `Solo room created: ${room.id}` });

      roomService.startSoloRound(room, difficulty);
    });

    socket.on("move", ({ x, z }) => {
      const roomId = socket.data.roomId;
      if (!roomId) {
        return;
      }

      roomService.setPlayerInput(roomId, userId, x, z);
    });

    socket.on("moveInput", ({ x, z }) => {
      const roomId = socket.data.roomId;
      if (!roomId) {
        return;
      }

      roomService.setPlayerInput(roomId, userId, x, z);
    });

    socket.on("reconnect", () => {
      const result = roomService.reconnectPlayer(userId, socket.id);
      if (!result.ok || !result.room) {
        return;
      }

      socket.join(result.room.id);
      socket.data.roomId = result.room.id;
      socket.emit("joinedRoom", {
        roomId: result.room.id,
        playerId: result.player.userId,
      });
    });

    socket.on("leaveRoom", () => {
      const roomId = socket.data.roomId;
      if (!roomId) {
        return;
      }

      const result = roomService.handleLeave(roomId, userId);

      socket.leave(roomId);
      socket.data.roomId = null;

      if (result.player) {
        io.to(roomId).emit("systemMessage", { message: `${result.player.name} left.` });
      }

      if (result.room) {
        roomService.broadcastRoomState(result.room);
        roomService.notifyWaitingForOpponent(result.room);
      }
    });

    socket.on("disconnect", () => {
      const roomId = socket.data.roomId;
      if (!roomId) {
        return;
      }

      const result = roomService.handleDisconnect(roomId, userId);

      if (!result.player || !result.room) {
        return;
      }

      roomService.broadcastRoomState(result.room);
    });
  });
}

module.exports = {
  registerSocketHandlers,
};
