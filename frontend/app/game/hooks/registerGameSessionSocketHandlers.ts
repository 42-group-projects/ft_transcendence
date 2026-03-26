import type { Dispatch, SetStateAction } from "react";
import type { Socket } from "socket.io-client";

import type { GameConstants, PlayerState, RoomStatePayload } from "../types";

type RegisterGameSessionSocketHandlersArgs = {
  socket: Socket;
  socketUrl: string;
  onRoomCreated?: (roomId: string) => void;
  setConnected: Dispatch<SetStateAction<boolean>>;
  setJoinedRoomId: Dispatch<SetStateAction<string | null>>;
  setLocalPlayerId: Dispatch<SetStateAction<string | null>>;
  setPlayers: Dispatch<SetStateAction<PlayerState[]>>;
  setErrorMessage: Dispatch<SetStateAction<string | null>>;
  setSystemMessage: Dispatch<SetStateAction<string | null>>;
  setRoundResultMessage: Dispatch<SetStateAction<string | null>>;
  setSessionEndedReason: Dispatch<SetStateAction<string | null>>;
  setIsPaused: Dispatch<SetStateAction<boolean>>;
  setCountdown: Dispatch<SetStateAction<number | null>>;
  setGameConstants: Dispatch<SetStateAction<GameConstants | null>>;
};

export function registerGameSessionSocketHandlers({
  socket,
  socketUrl,
  onRoomCreated,
  setConnected,
  setJoinedRoomId,
  setLocalPlayerId,
  setPlayers,
  setErrorMessage,
  setSystemMessage,
  setRoundResultMessage,
  setSessionEndedReason,
  setIsPaused,
  setCountdown,
  setGameConstants,
}: RegisterGameSessionSocketHandlersArgs) {
  const syncRoomState = ({ players: nextPlayers, status }: RoomStatePayload) => {
    setPlayers(nextPlayers);
    setIsPaused(status === "paused");
  };

  socket.on("connect", () => {
    setConnected(true);
    setErrorMessage(null);
    socket.emit("reconnect");
  });

  socket.on("gameConstants", (constants: GameConstants) => {
    setGameConstants(constants);
  });

  socket.on("disconnect", () => {
    setConnected(false);
    setSystemMessage("Connection lost. Trying to reconnect...");
  });

  socket.on("connect_error", (error) => {
    setConnected(false);
    const message = error?.message === "AUTH_MISSING_TOKEN" || error?.message === "AUTH_INVALID_TOKEN"
      ? "Authentication failed. Please login again."
      : `Unable to reach socket server at ${socketUrl}`;
    setErrorMessage(message);
  });

  socket.on("roomCreated", ({ roomId }: { roomId: string }) => {
    onRoomCreated?.(roomId);
    setSystemMessage(`Room created: ${roomId}`);
    setErrorMessage(null);
  });

  socket.on("joinedRoom", ({ roomId, playerId }: { roomId: string; playerId: string }) => {
    setJoinedRoomId(roomId);
    setLocalPlayerId(playerId);
    setErrorMessage(null);
    setRoundResultMessage(null);
    setSessionEndedReason(null);
    setSystemMessage(null);
    setCountdown(null);
  });

  socket.on("game_state", syncRoomState);
  socket.on("roomState", syncRoomState);

  socket.on("roomError", ({ message }: { message: string }) => {
    setErrorMessage(message);
  });

  socket.on("systemMessage", ({ message }: { message: string }) => {
    setSystemMessage(message);
  });

  socket.on("opponent_disconnected", ({ timeoutMs }: { timeoutMs: number }) => {
    setIsPaused(true);
    setSystemMessage(`Opponent disconnected. Waiting up to ${Math.ceil(timeoutMs / 1000)} seconds...`);
  });

  socket.on("opponent_reconnected", () => {
    setSystemMessage("Opponent reconnected.");
  });

  socket.on("countdown", ({ secondsRemaining }: { secondsRemaining: number }) => {
    setCountdown(secondsRemaining);
    if (secondsRemaining === 0) {
      setIsPaused(false);
    }
  });

  socket.on("session_ended", ({ reason, message }: { reason: string; message?: string }) => {
    setSessionEndedReason(reason);
    setIsPaused(false);
    setJoinedRoomId(null);
    setLocalPlayerId(null);
    setPlayers([]);
    setCountdown(null);

    if (message) {
      setSystemMessage(message);
    }
  });

  socket.on("roundStarted", () => {
    setSystemMessage(null);
    setRoundResultMessage(null);
    setCountdown(null);
    setSessionEndedReason(null);
  });

  socket.on("result", ({ message }: { message: string }) => {
    setRoundResultMessage(message);
  });

  socket.on("roundResult", ({ message }: { message: string }) => {
    setRoundResultMessage(message);
  });
}
