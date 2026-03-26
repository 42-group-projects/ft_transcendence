import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

import { resolveSocketUrl } from "../socket-url";
import type { PlayerState, RoomStatePayload } from "../types";

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
  const socketRef = useRef<Socket | null>(null);
  const socketUrl = useMemo(() => resolveSocketUrl(), []);

  const [connected, setConnected] = useState(false);
  const [joinedRoomId, setJoinedRoomId] = useState<string | null>(null);
  const [localPlayerId, setLocalPlayerId] = useState<string | null>(null);
  const [players, setPlayers] = useState<PlayerState[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [systemMessage, setSystemMessage] = useState<string | null>(null);
  const [roundResultMessage, setRoundResultMessage] = useState<string | null>(null);
  const [gameConstants, setGameConstants] = useState<{ PLAYER_RADIUS: number; SPAWN_DISTANCE: number; WORLD_HALF: number } | null>(null);

  useEffect(() => {
    const socket = io(socketUrl, {
      transports: ["websocket"],
      autoConnect: false,
    });
    let disposed = false;
    const connectTimeout = window.setTimeout(() => {
      if (!disposed) {
        socket.connect();
      }
    }, 0);

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      setErrorMessage(null);
    });

    socket.on("gameConstants", ({ PLAYER_RADIUS, SPAWN_DISTANCE, WORLD_HALF }: { PLAYER_RADIUS: number; SPAWN_DISTANCE: number; WORLD_HALF: number }) => {
      setGameConstants({ PLAYER_RADIUS, SPAWN_DISTANCE, WORLD_HALF });
    });

    socket.on("disconnect", () => {
      setConnected(false);
      setJoinedRoomId(null);
      setLocalPlayerId(null);
      setPlayers([]);
      setSystemMessage(null);
      setRoundResultMessage(null);
    });

    socket.on("connect_error", () => {
      setConnected(false);
      setErrorMessage(`Unable to reach socket server at ${socketUrl}`);
    });

    socket.on("roomCreated", ({ roomId }: { roomId: string }) => {
      onRoomCreated?.(roomId);
      setSystemMessage(`Room created: ${roomId}`);
      setErrorMessage(null);
    });

    socket.on("joinedRoom", ({ roomId: activeRoomId, playerId }: { roomId: string; playerId: string }) => {
      setJoinedRoomId(activeRoomId);
      setLocalPlayerId(playerId);
      setErrorMessage(null);
      setSystemMessage(null);
      setRoundResultMessage(null);
    });

    socket.on("roomState", ({ players: nextPlayers }: RoomStatePayload) => {
      setPlayers(nextPlayers);
    });

    socket.on("roomError", ({ message }: { message: string }) => {
      setErrorMessage(message);
    });

    socket.on("systemMessage", ({ message }: { message: string }) => {
      setSystemMessage(message);
    });

    socket.on("roundStarted", () => {
      setSystemMessage(null);
      setRoundResultMessage(null);
    });

    socket.on("roundResult", ({ message }: { message: string }) => {
      setRoundResultMessage(message);
    });

    return () => {
      disposed = true;
      window.clearTimeout(connectTimeout);
      socket.removeAllListeners();
      if (socket.connected || socket.active) {
        socket.disconnect();
      }
      socketRef.current = null;
    };
  }, [onRoomCreated, socketUrl]);

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

      socketRef.current?.emit("joinRoom", {
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
    gameConstants,
    setErrorMessage,
    setSystemMessage,
    createRoom,
    joinRoom,
    leaveRoom,
  };
}
