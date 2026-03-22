const {
  PLAYER_RADIUS,
  PLAYER_MASS,
  RESTITUTION,
  CHARGE_BONUS,
  TURN_SPEED,
  ACCEL,
  MAX_SPEED,
  FRICTION,
  PLATE_BOUNDARY_RADIUS,
  GRAVITY,
} = require("./constants");

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

  // Front-hit bonus: if a player's nose is pointing toward the target they
  // deliver a harder hit (max +CHARGE_BONUS at perfectly head-on angle).
  const aFwdX = Math.sin(a.heading);
  const aFwdZ = -Math.cos(a.heading);
  const bFwdX = Math.sin(b.heading);
  const bFwdZ = -Math.cos(b.heading);
  const aFrontHit = Math.max(0, aFwdX * nx + aFwdZ * nz);   // A charging into B
  const bFrontHit = Math.max(0, -(bFwdX * nx + bFwdZ * nz)); // B charging into A
  const chargeFactor = 1 + CHARGE_BONUS * Math.max(aFrontHit, bFrontHit);

  const impulse =
    (-(1 + RESTITUTION) * velAlongNormal * chargeFactor) / (1 / PLAYER_MASS + 1 / PLAYER_MASS);

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

function applyFalling(player, dt) {
  player.fallVelocityY -= GRAVITY * dt;
  player.position.y += player.fallVelocityY * dt;
}

function isPlayerOnPlate(player) {
  const distanceFromCenter = Math.hypot(player.position.x, player.position.z);
  return distanceFromCenter <= PLATE_BOUNDARY_RADIUS;
}

function applyMovementInput(player, dt) {
  player.heading += player.input.x * TURN_SPEED * dt;

  const throttle = -player.input.z;
  const forwardX = Math.sin(player.heading);
  const forwardZ = -Math.cos(player.heading);

  player.velocity.x += forwardX * throttle * ACCEL * dt;
  player.velocity.z += forwardZ * throttle * ACCEL * dt;
}

function capHorizontalSpeed(player) {
  const speed = Math.hypot(player.velocity.x, player.velocity.z);
  if (speed <= MAX_SPEED) {
    return;
  }

  const scale = MAX_SPEED / speed;
  player.velocity.x *= scale;
  player.velocity.z *= scale;
}

function applyHorizontalFriction(player) {
  player.velocity.x *= FRICTION;
  player.velocity.z *= FRICTION;
}

function advanceHorizontalPosition(player, dt) {
  player.position.x += player.velocity.x * dt;
  player.position.z += player.velocity.z * dt;
}

module.exports = {
  resolveBallCollision,
  applyFalling,
  isPlayerOnPlate,
  applyMovementInput,
  capHorizontalSpeed,
  applyHorizontalFriction,
  advanceHorizontalPosition,
};
