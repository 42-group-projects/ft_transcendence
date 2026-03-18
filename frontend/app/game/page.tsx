"use client";

import { useState } from "react";
import { Canvas } from "@react-three/fiber";

import { GameLobbyControls } from "./components/GameLobbyControls";
import { WorldScene } from "./components/WorldScene";
import { useGameSession } from "./hooks/useGameSession";
import { useMovementInput } from "./hooks/useMovementInput";

export default function GamePage() {
  const [name, setName] = useState("Player");
  const [roomId, setRoomId] = useState("");
  const [password, setPassword] = useState("");
  const {
    socketRef,
    connected,
    joinedRoomId,
    localPlayerId,
    players,
    errorMessage,
    systemMessage,
    createRoom,
    joinRoom,
    leaveRoom,
  } = useGameSession({ onRoomCreated: setRoomId });

  useMovementInput({ joinedRoomId, socketRef });

  const handleCreateRoom = () => {
    createRoom({ name, password });
  };

  const handleJoinRoom = () => {
    joinRoom({ roomId, password, name });
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <section className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4">
        <h1 className="text-2xl font-semibold">Multiplayer Prototype</h1>

        <GameLobbyControls
          name={name}
          roomId={roomId}
          password={password}
          connected={connected}
          joinedRoomId={joinedRoomId}
          playersCount={players.length}
          errorMessage={errorMessage}
          systemMessage={systemMessage}
          onNameChange={setName}
          onRoomIdChange={setRoomId}
          onPasswordChange={setPassword}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onLeaveRoom={leaveRoom}
        />

        <div className="h-[72vh] overflow-hidden rounded-lg border border-neutral-700">
          <Canvas shadows camera={{ position: [0, 8, 10], fov: 55 }}>
            <WorldScene players={players} localPlayerId={localPlayerId} />
          </Canvas>
        </div>
      </section>
    </main>
  );
}
