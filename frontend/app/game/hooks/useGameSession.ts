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

  // Track the joined room ID in a ref so the unmount cleanup can read the
  // latest value without needing it in the effect dependency array.
  const joinedRoomIdRef = useRef<string | null>(null);

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
      setJoinedRoomId: (value) => {
        // Mirror every update into the ref so the unmount handler can read it.
        const next = typeof value === "function" ? value(joinedRoomIdRef.current) : value;
        joinedRoomIdRef.current = next;
        setJoinedRoomId(value);
      },
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
    // However, if the player is still inside a room we must tell the server
    // they are leaving, because the socket itself won't disconnect (it is
    // shared with PresenceProvider). Without this the server never calls
    // handleDisconnect, the opponent's game is never paused, and the room
    // leaks until the reconnect timeout fires.
    return () => {
      cleanup();
      if (joinedRoomIdRef.current) {
        socket.emit("leaveRoom");
        joinedRoomIdRef.current = null;
      }
    };
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
