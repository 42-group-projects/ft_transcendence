export type PlayerState = {
  id: string;
  userId?: string;
  name: string;
  position: { x: number; y: number; z: number };
  velocity: { x: number; z: number };
  heading: number;
  eliminated?: boolean;
  disconnected?: boolean;
};

export type GameConstants = {
  TICK_RATE: number;
  TICK_MS: number;
  WORLD_HALF: number;
  PLAYER_RADIUS: number;
  PLAYER_MASS: number;
  MAX_PLAYERS_PER_ROOM: number;
  ACCEL: number;
  FRICTION: number;
  MAX_SPEED: number;
  RESTITUTION: number;
  CHARGE_BONUS: number;
  TURN_SPEED: number;
  GRAVITY: number;
  DASH_IMPULSE: number;
  DASH_COOLDOWN_MS: number;
  FALL_ELIMINATION_Y: number;
  SPAWN_DISTANCE: number;
  PLATE_THICKNESS: number;
  SPAWN_LINE_LENGTH: number;
  SPAWN_LINE_THICKNESS: number;
  PLATE_SURFACE_Y: number;
  PLATE_BOUNDARY_RADIUS: number;
  PLATE_EDGE_TOLERANCE: number;
  SOLO_CPU_ID: string;
  SOLO_CPU_DIFFICULTY: Record<string, {
    turnGain: number;
    maxThrottle: number;
    chargeBoost: number;
    predictionTime: number;
    wobbleAmp: number;
    wobbleFreq: number;
    brakeDistance: number;
    brakeThrottle: number;
    pivotThrottle: number;
  }>;
};

export type RoomStatePayload = {
  roomId: string;
  tick?: number;
  status?: "waiting" | "active" | "paused";
  players: PlayerState[];
};
