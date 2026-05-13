const TICK_RATE = 60;
const TICK_MS = 1000 / TICK_RATE;
const WORLD_HALF = 11;
const PLAYER_RADIUS = 0.6;
const PLAYER_MASS = 1;
const MAX_PLAYERS_PER_ROOM = 8;
const ACCEL = 70;
const FRICTION = 0.9;
const MAX_SPEED = 20;
const RESTITUTION = 1.5; // snappy bounces
const CHARGE_BONUS = 1.8; // up to +180% impulse for a direct front-on hit
const TURN_SPEED = 3.4;
const PLATE_RADIUS = WORLD_HALF;
const GRAVITY = 30;
const DASH_IMPULSE = 100; // instantaneous speed added when dashing (tweakable)
const DASH_COOLDOWN_MS = 1000; // cooldown between dashes in ms
const FALL_ELIMINATION_Y = -2;
const SPAWN_DISTANCE = 6;
const PLATE_SURFACE_Y = PLAYER_RADIUS;
const PLATE_BOUNDARY_RADIUS = PLATE_RADIUS - PLAYER_RADIUS;
const PLATE_EDGE_TOLERANCE = 1.0;

const SOLO_CPU_ID = '__solo_cpu__';
const SOLO_CPU_DIFFICULTY = {
    dummy: {
        turnGain: 0,
        maxThrottle: 0,
        chargeBoost: 0,
        predictionTime: 0,
        wobbleAmp: 0,
        wobbleFreq: 0,
        brakeDistance: 0,
        brakeThrottle: 0,
        pivotThrottle: 0,
    },
    easy: {
        turnGain: 0.65,
        maxThrottle: 0.2,
        chargeBoost: 0.08,
        predictionTime: 0,
        wobbleAmp: 0.08,
        wobbleFreq: 0.1,
        brakeDistance: 3.6,
        brakeThrottle: 0.28,
        pivotThrottle: 0.16,
    },
    medium: {
        turnGain: 0.95,
        maxThrottle: 0.6,
        chargeBoost: 0.22,
        predictionTime: 0.15,
        wobbleAmp: 0.03,
        wobbleFreq: 0.12,
        brakeDistance: 2.5,
        brakeThrottle: 0.45,
        pivotThrottle: 0.2,
    },
    hard: {
        turnGain: 1.15,
        maxThrottle: 0.95,
        chargeBoost: 0.4,
        predictionTime: 0.3,
        wobbleAmp: 0,
        wobbleFreq: 0.14,
        brakeDistance: 1.8,
        brakeThrottle: 0.6,
        pivotThrottle: 0.24,
    },
};

module.exports = {
    TICK_RATE,
    TICK_MS,
    WORLD_HALF,
    PLAYER_RADIUS,
    PLAYER_MASS,
    MAX_PLAYERS_PER_ROOM,
    ACCEL,
    FRICTION,
    MAX_SPEED,
    RESTITUTION,
    CHARGE_BONUS,
    TURN_SPEED,
    GRAVITY,
    DASH_IMPULSE,
    DASH_COOLDOWN_MS,
    FALL_ELIMINATION_Y,
    SPAWN_DISTANCE,
    PLATE_SURFACE_Y,
    PLATE_BOUNDARY_RADIUS,
    PLATE_EDGE_TOLERANCE,
    SOLO_CPU_ID,
    SOLO_CPU_DIFFICULTY,
};
