export function updateSoloCpuInput(room) {
    if (!room.solo || !room.roundInProgress || room.paused) {
        return;
    }

    const cpu = room.players.get(SOLO_CPU_ID);
    if (!cpu || cpu.eliminated) {
        return;
    }

    const target = [...room.players.values()].find(
        (player) => !player.isCpu && !player.eliminated && !player.disconnected,
    );

    if (!target) {
        cpu.input.x = 0;
        cpu.input.z = 0;
        return;
    }

    const config = getSoloDifficultyConfig(room.soloDifficulty);
    const targetX =
        target.position.x + target.velocity.x * config.predictionTime;
    const targetZ =
        target.position.z + target.velocity.z * config.predictionTime;
    const dx = targetX - cpu.position.x;
    const dz = targetZ - cpu.position.z;
    const distance = Math.hypot(dx, dz);

    const desiredHeading = Math.atan2(dx, -dz);
    const headingDelta = normalizeAngle(desiredHeading - cpu.heading);
    const headingAbs = Math.abs(headingDelta);
    const baseTurn = clamp(
        (headingDelta / (Math.PI / 3)) * config.turnGain,
        -1,
        1,
    );
    const wobble =
        Math.sin((room.tickCount || 0) * config.wobbleFreq) * config.wobbleAmp;
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
