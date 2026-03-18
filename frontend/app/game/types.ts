export type PlayerState = {
  id: string;
  name: string;
  position: { x: number; y: number; z: number };
  velocity: { x: number; z: number };
  heading: number;
};

export type RoomStatePayload = {
  roomId: string;
  players: PlayerState[];
};
