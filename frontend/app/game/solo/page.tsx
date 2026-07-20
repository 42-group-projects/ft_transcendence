'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';

import { GameResultOverlay } from '@/app/game/components/GameResultOverlay';
import { CountdownOverlay } from '@/app/game/components/CountdownOverlay';
import DashCooldownIndicator from '../components/DashCooldownIndicator';
import { WorldScene } from '../components/WorldScene';
import { useGameSession } from '../hooks/useGameSession';
import { useMovementInput } from '../hooks/useMovementInput';
import { useDashCooldown } from '../hooks/useDashCooldown';
import { FrameRateDisplay } from '../components/FrameRateDispay';
import { CustomizationPanel } from '../components/CustomizationPanel';
import { FpsCounter } from '../utils/FpsCounter';
import { useCustomization } from '../hooks/useCustomization';
import { apiGetMe } from '@/lib/api';

type SoloDifficulty = 'dummy' | 'easy' | 'medium' | 'hard';

export default function SoloPage() {
    const [fps, setFps] = useState(0);
    const [name, setName] = useState('Player');

    useEffect(() => {
        apiGetMe()
            .then(({ user }) => {
                if (user?.nickname) setName(user.nickname);
            })
            .catch(() => {});
    }, []);

    const [difficulty, setDifficulty] = useState<SoloDifficulty>('easy');
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
        countdown,
        gameConstants,
        leaveRoom,
    } = useGameSession();

    const {
        mawashiColor,
        dohyoTheme,
        update: updateCustomization,
    } = useCustomization();
    const dashCooldownTotalMs = gameConstants?.DASH_COOLDOWN_MS ?? 800;
    const { dashCooldownMs, triggerDash } =
        useDashCooldown(dashCooldownTotalMs);

    useMovementInput({ joinedRoomId, socketRef, onDash: triggerDash });

    const handleStart = () => {
        socketRef.current?.emit('soloStart', { name, difficulty });
    };

    const showGameResult = sessionEndedReason === 'game_finished';
    const resultTitle = roundResultMessage ?? 'Match finished';

    return (
        <main className="min-h-screen bg-neutral-950 text-neutral-100">
            <section className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-semibold tracking-tight">
                            solo dev mode
                        </h1>
                        <span className="flex items-center gap-2 text-sm text-neutral-400">
                            <span
                                className={`inline-block h-2 w-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}
                            />
                            {connected ? 'connected' : 'disconnected'}
                        </span>
                    </div>
                    <Link
                        href="/lobby"
                        className="rounded-md border border-neutral-700 px-3 py-1.5 text-xs font-medium text-neutral-200 transition hover:bg-neutral-900"
                    >
                        Back to Lobby
                    </Link>
                </div>

                {!joinedRoomId ? (
                    <div className="flex flex-wrap items-center gap-3">
                        <select
                            value={difficulty}
                            onChange={(event) =>
                                setDifficulty(
                                    event.target.value as SoloDifficulty,
                                )
                            }
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
                            room:{' '}
                            <span className="font-mono text-neutral-200">
                                {joinedRoomId}
                            </span>
                        </span>
                        <button
                            onClick={leaveRoom}
                            className="rounded border border-neutral-700 px-3 py-1 text-sm text-neutral-300 hover:bg-neutral-800"
                        >
                            Leave
                        </button>
                    </div>
                )}

                <CustomizationPanel
                    mawashiColor={mawashiColor}
                    dohyoTheme={dohyoTheme}
                    onUpdate={updateCustomization}
                />

                {errorMessage && (
                    <p className="text-sm text-red-400">{errorMessage}</p>
                )}
                {systemMessage && !errorMessage && (
                    <p className="text-sm text-neutral-400">{systemMessage}</p>
                )}
                {roundResultMessage && (
                    <p className="text-sm font-medium text-yellow-400">
                        {roundResultMessage}
                    </p>
                )}

                <div className="relative h-[70vh] overflow-hidden rounded-lg border border-neutral-700">
                    <Canvas
                        shadows="basic"
                        camera={{ position: [0, 8, 10], fov: 55 }}
                    >
                        <FpsCounter setFps={setFps} />
                        <WorldScene
                            players={players}
                            localPlayerId={localPlayerId}
                            gameConstants={gameConstants}
                            mawashiColor={mawashiColor}
                            dohyoTheme={dohyoTheme}
                        />
                    </Canvas>
                    <FrameRateDisplay fps={fps} />
                    <DashCooldownIndicator
                        dashCooldownMs={dashCooldownMs}
                        dashCooldownTotalMs={dashCooldownTotalMs}
                    />
                    {countdown && countdown > 0 ? (
                        <CountdownOverlay seconds={countdown} />
                    ) : null}
                    {showGameResult ? (
                        <GameResultOverlay
                            title={resultTitle}
                            description={systemMessage}
                        />
                    ) : null}
                </div>

                <p className="text-center text-xs text-neutral-600">
                    WASD / arrow keys to move
                </p>
            </section>
        </main>
    );
}
