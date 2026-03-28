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
  PLATE_EDGE_TOLERANCE,
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
  return distanceFromCenter <= PLATE_BOUNDARY_RADIUS + PLATE_EDGE_TOLERANCE;
}

function applyMovementInput(player, dt) {
  const inputX = Number(player.input.x) || 0;
  const inputZ = Number(player.input.z) || 0;

  const heading = Number(player.heading) || 0;
  const newHeading = heading + inputX * TURN_SPEED * dt;
  player.heading = Number.isFinite(newHeading) ? newHeading : 0;

  const throttle = -inputZ;
  const forwardX = Math.sin(player.heading);
  const forwardZ = -Math.cos(player.heading);

  const vx = Number(player.velocity.x) + forwardX * throttle * ACCEL * dt;
  const vz = Number(player.velocity.z) + forwardZ * throttle * ACCEL * dt;

  player.velocity.x = Number.isFinite(vx) ? vx : 0;
  player.velocity.z = Number.isFinite(vz) ? vz : 0;
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
  const px = Number(player.position.x) || 0;
  const pz = Number(player.position.z) || 0;
  const vx = Number(player.velocity.x) || 0;
  const vz = Number(player.velocity.z) || 0;

  const nx = px + vx * dt;
  const nz = pz + vz * dt;

  player.position.x = Number.isFinite(nx) ? nx : px;
  player.position.z = Number.isFinite(nz) ? nz : pz;
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
