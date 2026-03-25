"use client";

import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";

import { WorldScene } from "../components/WorldScene";
import { useGameSession } from "../hooks/useGameSession";
import { useMovementInput } from "../hooks/useMovementInput";

type SoloDifficulty = "dummy" | "easy" | "medium" | "hard";

export default function SoloPage() {
	const [name, setName] = useState("Dev");
	const [difficulty, setDifficulty] = useState<SoloDifficulty>("easy");
	const {
		socketRef,
		connected,
		joinedRoomId,
		localPlayerId,
		players,
		errorMessage,
		systemMessage,
		roundResultMessage,
		gameConstants,
		leaveRoom,
	} = useGameSession();

	useMovementInput({ joinedRoomId, socketRef });

	const handleStart = () => {
		socketRef.current?.emit("soloStart", { name, difficulty });
	};

	return (
		<main className="min-h-screen bg-neutral-950 text-neutral-100">
			<section className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4">
				<div className="flex items-center justify-between">
					<h1 className="text-xl font-semibold tracking-tight">solo dev mode</h1>
					<span className="flex items-center gap-2 text-sm text-neutral-400">
						<span className={`inline-block h-2 w-2 rounded-full ${connected ? "bg-green-500" : "bg-red-500"}`} />
						{connected ? "connected" : "disconnected"}
					</span>
				</div>

				{!joinedRoomId ? (
					<div className="flex flex-wrap items-center gap-3">
						<input
							className="rounded border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-sm text-neutral-100 placeholder-neutral-500 outline-none focus:border-neutral-500"
							placeholder="your name"
							value={name}
							onChange={(event) => setName(event.target.value)}
						/>
						<select
							value={difficulty}
							onChange={(event) => setDifficulty(event.target.value as SoloDifficulty)}
							className="rounded border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-sm text-neutral-100 outline-none focus:border-neutral-500"
						>	
							<option value="dummy">Dummy (no AI)</option>
							<option value="easy">Easy CPU</option>
							<option value="medium">Medium CPU</option>
							<option value="hard">Hard CPU</option>
						</select>
						<button
							disabled={!connected}
							onClick={handleStart}
							className="rounded bg-indigo-600 px-4 py-1.5 text-sm font-medium hover:bg-indigo-500 disabled:opacity-40"
						>
							Start Solo
						</button>
					</div>
				) : (
					<div className="flex items-center gap-3">
						<span className="text-sm text-neutral-400">
							room: <span className="font-mono text-neutral-200">{joinedRoomId}</span>
						</span>
						<button
							onClick={leaveRoom}
							className="rounded border border-neutral-700 px-3 py-1 text-sm text-neutral-300 hover:bg-neutral-800"
						>
							Leave
						</button>
					</div>
				)}

				{errorMessage && <p className="text-sm text-red-400">{errorMessage}</p>}
				{systemMessage && !errorMessage && <p className="text-sm text-neutral-400">{systemMessage}</p>}
				{roundResultMessage && <p className="text-sm font-medium text-yellow-400">{roundResultMessage}</p>}

				<div className="h-[70vh] overflow-hidden rounded-lg border border-neutral-700">
					<Canvas shadows={THREE.PCFShadowMap} camera={{ position: [0, 8, 10], fov: 55 }}>
						<WorldScene players={players} localPlayerId={localPlayerId} gameConstants={gameConstants} />
					</Canvas>
				</div>

				<p className="text-center text-xs text-neutral-600">WASD / arrow keys to move</p>
			</section>
		</main>
	);
}
