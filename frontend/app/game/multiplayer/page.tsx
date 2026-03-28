"use client";

import Link from "next/link";
import { useState } from "react";
import { Canvas } from "@react-three/fiber";

import { GameResultOverlay } from "@/app/game/components/GameResultOverlay";
import { CountdownOverlay } from "@/app/game/components/CountdownOverlay";
import { GameLobbyControls } from "../components/GameLobbyControls";
import { WorldScene } from "../components/WorldScene";
import { useGameSession } from "../hooks/useGameSession";
import { useMovementInput } from "../hooks/useMovementInput";
import { useDashCooldown } from "../hooks/useDashCooldown";
import { FrameRateDisplay } from "../components/FrameRateDispay";
import { FpsCounter } from "../utils/FpsCounter";

export default function GamePage() {
  const [name, setName] = useState("Player");
  const [roomId, setRoomId] = useState("");
  const [password, setPassword] = useState("");
  const [fps, setFps] = useState(0);
  const {
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
    createRoom,
    joinRoom,
    leaveRoom,
  } = useGameSession({ onRoomCreated: setRoomId });

  const dashCooldownTotalMs = gameConstants?.DASH_COOLDOWN_MS ?? 800;
  const { dashCooldownMs, triggerDash } = useDashCooldown(dashCooldownTotalMs);
  useMovementInput({ joinedRoomId, socketRef, onDash: triggerDash });

  const handleCreateRoom = () => {
    createRoom({ name, password });
  };

  const handleJoinRoom = () => {
    joinRoom({ roomId, password, name });
  };

  const showGameResult = sessionEndedReason === "game_finished";
  const resultTitle = roundResultMessage ?? "Match finished";

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <section className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Multiplayer Prototype</h1>
          <Link
            href="/lobby"
            className="rounded-md border border-neutral-700 px-3 py-1.5 text-xs font-medium text-neutral-200 transition hover:bg-neutral-900"
          >
            Back to Lobby
          </Link>
        </div>

        <GameLobbyControls
          name={name}
          roomId={roomId}
          password={password}
          connected={connected}
          joinedRoomId={joinedRoomId}
          playersCount={players.length}
          errorMessage={errorMessage}
          systemMessage={systemMessage}
          roundResultMessage={roundResultMessage}
          onNameChange={setName}
          onRoomIdChange={setRoomId}
          onPasswordChange={setPassword}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onLeaveRoom={leaveRoom}
        />

        <div className="relative h-[72vh] overflow-hidden rounded-lg border border-neutral-700">
          <Canvas shadows camera={{ position: [0, 8, 10], fov: 55 }}>
            <FpsCounter setFps={setFps} />
            <WorldScene
              players={players}
              localPlayerId={localPlayerId}
              gameConstants={gameConstants}
              dashCooldownMs={dashCooldownMs}
              dashCooldownTotalMs={dashCooldownTotalMs}
            />
          </Canvas>
          <FrameRateDisplay fps={fps} />
          {countdown && countdown > 0 ? <CountdownOverlay seconds={countdown} /> : null}
          {showGameResult ? <GameResultOverlay title={resultTitle} description={systemMessage} /> : null}
        </div>
      </section>
    </main>
  );
}
