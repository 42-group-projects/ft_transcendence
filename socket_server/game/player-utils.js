const {
  PLAYER_RADIUS,
  SPAWN_DISTANCE,
  PLATE_SURFACE_Y,
} = require("./constants");

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
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
  const players = [...room.players.values()];
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
  player.eliminated = false;
  player.roundResult = null;
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
    name: player.name,
    position: player.position,
    velocity: player.velocity,
    heading: player.heading,
    eliminated: player.eliminated,
  }));
}

module.exports = {
  clamp,
  sanitizeName,
  makePlayer,
  makeRoom,
  placePlayerAtSpawnSlot,
  placePlayersForRound,
  resetPlayerForRound,
  stopPlayerHorizontalMovement,
  serializePlayers,
};
