// SoloCpuController.js
// AI controller for solo CPU player using a state machine

const { SOLO_CPU_ID } = require("./constants");
const { clamp } = require("./player-utils");

// Possible AI states
const AIState = {
  IDLE: "idle",
  AGGRESSIVE: "aggressive",
  FAKEOUT: "fakeout",
  EDGE_GUARD: "edge_guard",
};

class SoloCpuController {
  constructor(getConfig) {
    this.state = AIState.IDLE;
    this.stateTimer = 0;
    this.getConfig = getConfig; // function to get difficulty config
    this.lastTargetPos = null;
    this.fakeoutCooldown = 0;
  }

  // Main update method called every tick
  update(room, tickCount) {
    if (!room.solo || !room.roundInProgress || room.paused) return;
    const cpu = room.players.get(SOLO_CPU_ID);
    if (!cpu || cpu.eliminated) return;
    const target = [...room.players.values()].find(
      (p) => !p.isCpu && !p.eliminated && !p.disconnected
    );
    if (!target) {
      cpu.input.x = 0;
      cpu.input.z = 0;
      return;
    }
    const config = this.getConfig(room.soloDifficulty);
    this._updateState(cpu, target, room, tickCount);
    this._applyStateLogic(cpu, target, room, config, tickCount);
  }

  _updateState(cpu, target, room, tickCount) {
    // Simple state transitions: aggressive if far, fakeout sometimes, edge guard if near edge
    const dx = target.position.x - cpu.position.x;
    const dz = target.position.z - cpu.position.z;
    const distance = Math.hypot(dx, dz);
    const edgeDist = Math.abs(Math.hypot(cpu.position.x, cpu.position.z) - (room.plateRadius || 10));
    // Prioritize edge guard if close to edge
    if (edgeDist < 2.5) {
      this.state = AIState.EDGE_GUARD;
      this.stateTimer = 30;
      return;
    }
    // Occasionally fakeout
    if (this.fakeoutCooldown <= 0 && Math.random() < 0.04 && distance > 2) {
      this.state = AIState.FAKEOUT;
      this.stateTimer = 20 + Math.floor(Math.random() * 20);
      this.fakeoutCooldown = 80 + Math.floor(Math.random() * 60);
      return;
    }
    // Aggressive if far
    if (distance > 2.5) {
      this.state = AIState.AGGRESSIVE;
      this.stateTimer = 40;
      return;
    }
    // Default to idle
    this.state = AIState.IDLE;
    this.stateTimer = 20;
  }

  _applyStateLogic(cpu, target, room, config, tickCount) {
    // Decrement timers
    if (this.stateTimer > 0) this.stateTimer--;
    if (this.fakeoutCooldown > 0) this.fakeoutCooldown--;
    // Predict target
    const targetX = target.position.x + target.velocity.x * config.predictionTime;
    const targetZ = target.position.z + target.velocity.z * config.predictionTime;
    const dx = targetX - cpu.position.x;
    const dz = targetZ - cpu.position.z;
    const distance = Math.hypot(dx, dz);
    const desiredHeading = Math.atan2(dx, -dz);
    const headingDelta = normalizeAngle(desiredHeading - cpu.heading);
    const headingAbs = Math.abs(headingDelta);
    let turn = clamp((headingDelta / (Math.PI / 3)) * config.turnGain, -1, 1);
    let throttle = 0.2;
    let dash = false;
    // State logic
    switch (this.state) {
      case AIState.AGGRESSIVE:
        throttle = config.maxThrottle;
        if (headingAbs < 0.2 && distance > 1.5) dash = true;
        break;
      case AIState.FAKEOUT:
        // Move erratically, sometimes away from player
        turn += Math.sin(tickCount * 0.25) * 0.7;
        throttle = 0.3 + 0.2 * Math.sin(tickCount * 0.5);
        if (this.stateTimer < 10) turn *= -1; // sudden fake
        break;
      case AIState.EDGE_GUARD:
        // Try to keep between player and edge
        throttle = 0.5;
        turn = clamp((headingDelta / (Math.PI / 2)), -1, 1);
        break;
      case AIState.IDLE:
      default:
        throttle = 0.18;
        break;
    }
    // Apply input
    cpu.input.x = clamp(turn, -1, 1);
    cpu.input.z = -clamp(throttle, 0.16, config.maxThrottle);
    // Dashing logic
    if (dash && this._canDash(cpu, room)) {
      this._doDash(cpu, room);
    }
  }

  _canDash(cpu, room) {
    const now = Date.now();
    return !cpu.lastDashAt || now - cpu.lastDashAt > (room.dashCooldownMs || 1000);
  }

  _doDash(cpu, room) {
    cpu.lastDashAt = Date.now();
    cpu.isDashing = true;
    cpu.dashFriction = 0.97; // Lower friction for momentum effect
    setTimeout(() => {
      cpu.isDashing = false;
      cpu.dashFriction = null;
    }, 320); // Dash state lasts 320ms
  }
}

function normalizeAngle(angle) {
  let normalized = angle;
  while (normalized > Math.PI) normalized -= Math.PI * 2;
  while (normalized < -Math.PI) normalized += Math.PI * 2;
  return normalized;
}

module.exports = { SoloCpuController, AIState };
