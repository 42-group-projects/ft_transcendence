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
  PLAYER_RADIUS: number;
  SPAWN_DISTANCE: number;
  WORLD_HALF: number;
  DASH_COOLDOWN_MS: number;
};

export type RoomStatePayload = {
  roomId: string;
  tick?: number;
  status?: "waiting" | "active" | "paused";
  players: PlayerState[];
};
