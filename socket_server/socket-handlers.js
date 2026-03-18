function registerSocketHandlers(io, roomService) {
  io.on("connection", (socket) => {
    socket.on("createRoom", ({ password, name }) => {
      const trimmedPassword = (password || "").trim();
      if (!trimmedPassword) {
        socket.emit("roomError", { message: "Password is required to create a room." });
        return;
      }

      const room = roomService.createRoom(trimmedPassword);

      socket.emit("roomCreated", { roomId: room.id });
      socket.emit("systemMessage", { message: `Room created: ${room.id}` });

      roomService.addPlayerToRoom(room, socket.id, name);

      socket.join(room.id);
      socket.data.roomId = room.id;

      socket.emit("joinedRoom", { roomId: room.id, playerId: socket.id });
      roomService.broadcastRoomState(room);
    });

    socket.on("joinRoom", ({ roomId, password, name }) => {
      const room = roomService.getRoom((roomId || "").trim());

      if (!room) {
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

      const player = roomService.addPlayerToRoom(room, socket.id, name);

      socket.join(room.id);
      socket.data.roomId = room.id;

      socket.emit("joinedRoom", { roomId: room.id, playerId: socket.id });
      socket.emit("systemMessage", { message: `Joined room: ${room.id}` });
      io.to(room.id).emit("systemMessage", { message: `${player.name} joined.` });

      roomService.broadcastRoomState(room);
    });

    socket.on("moveInput", ({ x, z }) => {
      const roomId = socket.data.roomId;
      if (!roomId) {
        return;
      }

      roomService.setPlayerInput(roomId, socket.id, x, z);
    });

    socket.on("leaveRoom", () => {
      const roomId = socket.data.roomId;
      if (!roomId) {
        return;
      }

      const room = roomService.getRoom(roomId);
      if (!room) {
        socket.data.roomId = null;
        return;
      }

      const result = roomService.removePlayer(roomId, socket.id);

      socket.leave(roomId);
      socket.data.roomId = null;

      if (result.player) {
        io.to(roomId).emit("systemMessage", { message: `${result.player.name} left.` });
      }
    });

    socket.on("disconnect", () => {
      const roomId = socket.data.roomId;
      if (!roomId) {
        return;
      }

      const result = roomService.removePlayer(roomId, socket.id);
      if (!result.player) {
        return;
      }

      io.to(roomId).emit("systemMessage", { message: `${result.player.name} disconnected.` });
    });
  });
}

module.exports = {
  registerSocketHandlers,
};
