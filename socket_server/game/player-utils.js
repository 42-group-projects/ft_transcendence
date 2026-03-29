const { PLAYER_RADIUS, SPAWN_DISTANCE, PLATE_SURFACE_Y } = require("./constants");

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function randomRoomId() {
  return `room_${Math.random().toString(36).slice(2, 8)}`;
}

function sanitizeName(name) {
  return (name || "Player").trim() || "Player";
}

function makePlayer({ userId, socketId, name }) {
  return {
    id: userId,
    userId,
    socketId,
    name,
    position: { x: 0, y: PLAYER_RADIUS, z: 0 },
    velocity: { x: 0, z: 0 },
    input: { x: 0, z: 0 },
    heading: 0,
    fallVelocityY: 0,
    lastDashAt: 0,
    isCpu: false,
    eliminated: false,
    disconnected: false,
    roundResult: null,
  };
}

function makeCPUball(id, name) {
  return {
    id,
    userId: id,
    socketId: null,
    name,
    position: { x: 0, y: PLATE_SURFACE_Y, z: 0 },
    velocity: { x: 0, z: 0 },
    input: { x: 0, z: 0 },
    heading: 0,
    fallVelocityY: 0,
    lastDashAt: 0,
    isCpu: true,
    eliminated: false,
    disconnected: false,
    roundResult: null,
  };
}

function makeRoom(password) {
  return {
    id: randomRoomId(),
    password,
    players: new Map(),
    playerBySocketId: new Map(),
    reconnectTimeouts: new Map(),
    interval: null,
    roundInProgress: false,
    paused: false,
    tickCount: 0,
    solo: false,
  };
}

function placePlayerAtSpawnSlot(player, slotIndex) {
  const isNorthSide = slotIndex % 2 === 0;

  player.position = {
    x: 0,
    y: PLATE_SURFACE_Y,
    z: isNorthSide ? SPAWN_DISTANCE : -SPAWN_DISTANCE,
  };
  player.heading = isNorthSide ? 0 : Math.PI;
}

function placePlayersForRound(room) {
  const players = [...room.players.values()].filter((player) => !player.isCpu);
  players.forEach((player, index) => {
    placePlayerAtSpawnSlot(player, index);
  });
}

function resetPlayerForRound(player) {
  player.velocity.x = 0;
  player.velocity.z = 0;
  player.input.x = 0;
  player.input.z = 0;
  player.fallVelocityY = 0;
  player.position.y = PLATE_SURFACE_Y;
  player.lastDashAt = 0;
  player.eliminated = false;
  player.disconnected = false;
  player.roundResult = null;
}

function safeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function sanitizePlayerNumbers(player) {
  // Ensure core numeric fields are finite numbers to prevent NaN propagation
  player.position.x = safeNumber(player.position.x, 0);
  player.position.y = safeNumber(player.position.y, PLATE_SURFACE_Y);
  player.position.z = safeNumber(player.position.z, 0);

  player.velocity.x = safeNumber(player.velocity.x, 0);
  player.velocity.z = safeNumber(player.velocity.z, 0);

  player.input.x = safeNumber(player.input.x, 0);
  player.input.z = safeNumber(player.input.z, 0);

  player.heading = safeNumber(player.heading, 0);
  player.fallVelocityY = safeNumber(player.fallVelocityY, 0);

  // sanitize lastDashAt
  player.lastDashAt = safeNumber(player.lastDashAt, 0);
}

function stopPlayerHorizontalMovement(player) {
  player.input.x = 0;
  player.input.z = 0;
  player.velocity.x = 0;
  player.velocity.z = 0;
}

function serializePlayers(playersMap) {
  return [...playersMap.values()].map((player) => ({
    id: player.id,
    userId: player.userId,
    name: player.name,
    position: player.position,
    velocity: player.velocity,
    heading: player.heading,
    eliminated: player.eliminated,
    disconnected: player.disconnected,
  }));
}

module.exports = {
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
  sanitizePlayerNumbers,
  safeNumber,
};
