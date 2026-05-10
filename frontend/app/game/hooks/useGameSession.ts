import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getToken } from "@/lib/api";
import { usePresenceSocket } from "@/app/components/PresenceProvider";
import { resolveSocketUrl } from "../socket-url";
import type { GameConstants, PlayerState } from "../types";
import { registerGameSessionSocketHandlers } from "./registerGameSessionSocketHandlers";

type CreateRoomArgs = {
  name: string;
  password: string;
};

type JoinRoomArgs = {
  roomId: string;
  name: string;
  password: string;
};

type UseGameSessionArgs = {
  onRoomCreated?: (roomId: string) => void;
};

export function useGameSession({ onRoomCreated }: UseGameSessionArgs = {}) {
  // Reuse the shared socket from PresenceProvider so disconnecting the game
  // page doesn't trigger an offline broadcast for this user.
  const socket = usePresenceSocket();
  const socketRef = useRef(socket);
  socketRef.current = socket; // keep ref in sync for emit callbacks
  const socketUrl = useMemo(() => resolveSocketUrl(), []);

  const [connected, setConnected] = useState(() => socketRef.current?.connected ?? false);
  const [joinedRoomId, setJoinedRoomId] = useState<string | null>(null);
  const [localPlayerId, setLocalPlayerId] = useState<string | null>(null);
  const [players, setPlayers] = useState<PlayerState[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    return getToken() ? null : "Please login first.";
  });
  const [systemMessage, setSystemMessage] = useState<string | null>(null);
  const [roundResultMessage, setRoundResultMessage] = useState<string | null>(null);
  const [sessionEndedReason, setSessionEndedReason] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [gameConstants, setGameConstants] = useState<GameConstants | null>(null);

  useEffect(() => {
    if (!socket) return;

    // Socket is already connected (shared from PresenceProvider) — sync state immediately.
    if (socket.connected) {
      setConnected(true);
      setErrorMessage(null);
      socket.emit("reconnect"); // let server know we're (re)joining the game page
    }

    const cleanup = registerGameSessionSocketHandlers({
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
    });

    // On unmount: remove only game-specific handlers. Do NOT disconnect —
    // the socket belongs to PresenceProvider and must stay alive.
    return cleanup;
  }, [socket, onRoomCreated, socketUrl]);

  const createRoom = useCallback(
    ({ name, password }: CreateRoomArgs) => {
      if (!connected) {
        setErrorMessage("Socket is not connected yet.");
        return;
      }

      if (!password.trim()) {
        setErrorMessage("Please provide a password first.");
        return;
      }

      socketRef.current?.emit("createRoom", {
        password,
        name,
      });
    },
    [connected]
  );

  const joinRoom = useCallback(
    ({ roomId, name, password }: JoinRoomArgs) => {
      if (!connected) {
        setErrorMessage("Socket is not connected yet.");
        return;
      }

      if (!roomId.trim() || !password.trim()) {
        setErrorMessage("Room ID and password are required.");
        return;
      }

      socketRef.current?.emit("join", {
        roomId,
        password,
        name,
      });
    },
    [connected]
  );

  const leaveRoom = useCallback(() => {
    socketRef.current?.emit("leaveRoom");
    setJoinedRoomId(null);
    setLocalPlayerId(null);
    setPlayers([]);
    setSystemMessage(null);
    setRoundResultMessage(null);
    setCountdown(null);
    setSessionEndedReason(null);
  }, []);

  return {
    socketRef,
    connected,
    joinedRoomId,
    localPlayerId,
    players,
    errorMessage,
    systemMessage,
    roundResultMessage,
    sessionEndedReason,
    isPaused,
    countdown,
    gameConstants,
    setErrorMessage,
    setSystemMessage,
    createRoom,
    joinRoom,
    leaveRoom,
  };
}
