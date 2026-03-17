"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { io, Socket } from "socket.io-client";
import * as THREE from "three";

type PlayerState = {
  id: string;
  name: string;
  position: { x: number; y: number; z: number };
  velocity: { x: number; z: number };
};

type RoomStatePayload = {
  roomId: string;
  players: PlayerState[];
};

function resolveSocketUrl() {
  const configured = process.env.NEXT_PUBLIC_SOCKET_URL;

  if (typeof window === "undefined") {
    return configured || "http://localhost:3001";
  }

  if (!configured) {
    return `${window.location.protocol}//${window.location.hostname}:3001`;
  }

  try {
    const parsed = new URL(configured);

    if (parsed.hostname === "socket-server") {
      return `${window.location.protocol}//${window.location.hostname}:3001`;
    }

    return configured;
  } catch {
    return `${window.location.protocol}//${window.location.hostname}:3001`;
  }
}

const PLAYER_RADIUS = 0.6;
const WORLD_SIZE = 28;

function FollowCamera({
  target,
}: {
  target: THREE.Vector3 | null;
}) {
  const { camera } = useThree();

  useFrame(() => {
    if (!target) {
      return;
    }

    const desired = new THREE.Vector3(target.x, target.y + 6, target.z + 7);
    camera.position.lerp(desired, 0.12);
    camera.lookAt(target.x, target.y, target.z);
  });

  return null;
}

function World({
  players,
  localPlayerId,
}: {
  players: PlayerState[];
  localPlayerId: string | null;
}) {
  const localPlayer = useMemo(
    () => players.find((player) => player.id === localPlayerId) || null,
    [players, localPlayerId]
  );

  const target = localPlayer
    ? new THREE.Vector3(
        localPlayer.position.x,
        localPlayer.position.y,
        localPlayer.position.z
      )
    : null;

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight intensity={1.2} position={[8, 12, 8]} castShadow />

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[WORLD_SIZE, WORLD_SIZE]} />
        <meshStandardMaterial color="#2f2f2f" />
      </mesh>

      <mesh position={[0, 2, -WORLD_SIZE / 2]}>
        <boxGeometry args={[WORLD_SIZE, 4, 0.4]} />
        <meshStandardMaterial color="#5a5a5a" />
      </mesh>
      <mesh position={[0, 2, WORLD_SIZE / 2]}>
        <boxGeometry args={[WORLD_SIZE, 4, 0.4]} />
        <meshStandardMaterial color="#5a5a5a" />
      </mesh>
      <mesh position={[-WORLD_SIZE / 2, 2, 0]}>
        <boxGeometry args={[0.4, 4, WORLD_SIZE]} />
        <meshStandardMaterial color="#5a5a5a" />
      </mesh>
      <mesh position={[WORLD_SIZE / 2, 2, 0]}>
        <boxGeometry args={[0.4, 4, WORLD_SIZE]} />
        <meshStandardMaterial color="#5a5a5a" />
      </mesh>

      {players.map((player) => {
        const isSelf = player.id === localPlayerId;
        return (
          <group
            key={player.id}
            position={[player.position.x, player.position.y, player.position.z]}
          >
            <mesh castShadow>
              <sphereGeometry args={[PLAYER_RADIUS, 24, 24]} />
              <meshStandardMaterial color={isSelf ? "#3b82f6" : "#f97316"} />
            </mesh>
            <mesh position={[0, PLAYER_RADIUS + 0.35, 0]}>
              <planeGeometry args={[1.8, 0.45]} />
              <meshBasicMaterial color="#000000" transparent opacity={0.35} />
            </mesh>
          </group>
        );
      })}

      <FollowCamera target={target} />
      <OrbitControls enablePan={false} enableZoom={false} enableRotate={false} />
    </>
  );
}

export default function GamePage() {
  const socketRef = useRef<Socket | null>(null);
  const inputRef = useRef({ up: false, down: false, left: false, right: false });
  const socketUrl = useMemo(() => resolveSocketUrl(), []);

  const [name, setName] = useState("Player");
  const [roomId, setRoomId] = useState("");
  const [password, setPassword] = useState("");
  const [connected, setConnected] = useState(false);
  const [joinedRoomId, setJoinedRoomId] = useState<string | null>(null);
  const [localPlayerId, setLocalPlayerId] = useState<string | null>(null);
  const [players, setPlayers] = useState<PlayerState[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [systemMessage, setSystemMessage] = useState<string | null>(null);

  useEffect(() => {
    const socket = io(socketUrl, {
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      setErrorMessage(null);
    });

    socket.on("disconnect", () => {
      setConnected(false);
      setJoinedRoomId(null);
      setLocalPlayerId(null);
      setPlayers([]);
    });

    socket.on("connect_error", () => {
      setConnected(false);
      setErrorMessage(`Unable to reach socket server at ${socketUrl}`);
    });

    socket.on("roomCreated", ({ roomId: newRoomId }: { roomId: string }) => {
      setRoomId(newRoomId);
      setSystemMessage(`Room created: ${newRoomId}`);
      setErrorMessage(null);
    });

    socket.on(
      "joinedRoom",
      ({ roomId: activeRoomId, playerId }: { roomId: string; playerId: string }) => {
        setJoinedRoomId(activeRoomId);
        setLocalPlayerId(playerId);
        setErrorMessage(null);
      }
    );

    socket.on("roomState", ({ players: nextPlayers }: RoomStatePayload) => {
      setPlayers(nextPlayers);
    });

    socket.on("roomError", ({ message }: { message: string }) => {
      setErrorMessage(message);
    });

    socket.on("systemMessage", ({ message }: { message: string }) => {
      setSystemMessage(message);
    });

    return () => {
      socket.disconnect();
    };
  }, [socketUrl]);

  useEffect(() => {
    if (!joinedRoomId) {
      return;
    }

    const handleKey = (event: KeyboardEvent, pressed: boolean) => {
      if (event.repeat) {
        return;
      }

      if (event.code === "KeyW" || event.code === "ArrowUp") {
        inputRef.current.up = pressed;
      }
      if (event.code === "KeyS" || event.code === "ArrowDown") {
        inputRef.current.down = pressed;
      }
      if (event.code === "KeyA" || event.code === "ArrowLeft") {
        inputRef.current.left = pressed;
      }
      if (event.code === "KeyD" || event.code === "ArrowRight") {
        inputRef.current.right = pressed;
      }
    };

    const onKeyDown = (event: KeyboardEvent) => handleKey(event, true);
    const onKeyUp = (event: KeyboardEvent) => handleKey(event, false);

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    const sendInput = setInterval(() => {
      const x = Number(inputRef.current.right) - Number(inputRef.current.left);
      const z = Number(inputRef.current.down) - Number(inputRef.current.up);

      socketRef.current?.emit("moveInput", { x, z });
    }, 1000 / 30);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      clearInterval(sendInput);
      socketRef.current?.emit("moveInput", { x: 0, z: 0 });
    };
  }, [joinedRoomId]);

  const createRoom = () => {
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
  };

  const joinRoom = () => {
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
  };

  const leaveRoom = () => {
    socketRef.current?.emit("leaveRoom");
    setJoinedRoomId(null);
    setLocalPlayerId(null);
    setPlayers([]);
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <section className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4">
        <h1 className="text-2xl font-semibold">Multiplayer Prototype</h1>

        <div className="grid gap-3 rounded-lg border border-neutral-700 bg-neutral-900 p-4 md:grid-cols-5">
          <input
            className="rounded border border-neutral-600 bg-neutral-800 px-3 py-2 outline-none"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Player name"
          />
          <input
            className="rounded border border-neutral-600 bg-neutral-800 px-3 py-2 outline-none"
            value={roomId}
            onChange={(event) => setRoomId(event.target.value)}
            placeholder="Room ID"
          />
          <input
            className="rounded border border-neutral-600 bg-neutral-800 px-3 py-2 outline-none"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Room password"
            type="password"
          />

          <button
            className="rounded bg-blue-600 px-3 py-2 font-medium hover:bg-blue-500"
            onClick={createRoom}
            type="button"
          >
            Create room
          </button>

          <button
            className="rounded bg-orange-600 px-3 py-2 font-medium hover:bg-orange-500"
            onClick={joinRoom}
            type="button"
          >
            Join room
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-300">
          <span>Socket: {connected ? "connected" : "disconnected"}</span>
          <span>Room: {joinedRoomId ?? "none"}</span>
          <span>Players: {players.length}</span>
          {joinedRoomId ? (
            <button
              className="rounded border border-neutral-600 px-2 py-1 hover:bg-neutral-800"
              onClick={leaveRoom}
              type="button"
            >
              Leave room
            </button>
          ) : null}
        </div>

        {errorMessage ? <p className="text-sm text-red-400">{errorMessage}</p> : null}
        {systemMessage ? <p className="text-sm text-emerald-400">{systemMessage}</p> : null}

        <div className="h-[72vh] overflow-hidden rounded-lg border border-neutral-700">
          <Canvas shadows camera={{ position: [0, 8, 10], fov: 55 }}>
            <World players={players} localPlayerId={localPlayerId} />
          </Canvas>
        </div>
      </section>
    </main>
  );
}
