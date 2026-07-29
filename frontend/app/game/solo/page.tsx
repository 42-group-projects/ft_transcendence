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
        environment,
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
        <main className="min-h-screen bg- text-stone-900">
            <div className="pointer-events-none fixed inset-0 -z-10">
                <div className="absolute -top-40 -left-40 h-[800px] w-[800px] rounded-full bg-gradient-to-r from-yellow-200/25 via-yellow-100/30 to-yellow-200/20 blur-3xl" />
                <div className="absolute -bottom-32 -right-32 h-[800px] w-[800px] rounded-full bg-gradient-to-l from-yellow-200/25 via-yellow-100/35 to-yellow-200/20 blur-3xl" />
            </div>
            <section className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-semibold tracking-tight text-stone-950">
                            Practice Mode
                        </h1>
                        <span className="flex items-center gap-2 text-sm text-stone-700">
                            <span
                                className={`inline-block h-2 w-2 ${connected ? 'bg-green-600' : 'bg-red-800'}`}
                            />
                            {connected ? 'connected' : 'disconnected'}
                        </span>
                    </div>
                    <Link
                        href="/lobby"
                        className="border-2 border-neutral-600 px-3 py-1.5 text-xs font-medium text-stone-900 transition hover:bg-stone-100 bg-yellow-100"
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
                            className="rounded border-2 border-neutral-600 bg-yellow-100 px-3 py-1.5 text-sm text-stone-900 outline-none focus:border-stone-700 hover:bg-yellow-50"
                        >
                            <option value="dummy">Dummy (no AI)</option>
                            <option value="easy">Easy CPU</option>
                            <option value="medium">Medium CPU</option>
                            <option value="hard">Hard CPU</option>
                        </select>
                        <button
                            disabled={!connected}
                            onClick={handleStart}
                            className="rounded px-4 py-1.5 text-sm font-medium border-2 border-neutral-600 hover:bg-yellow-50 disabled:opacity-40 bg-yellow-100"
                        >
                            Start Solo
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-stone-700">
                            room:{' '}
                            <span className="font-mono text-stone-900">
                                {joinedRoomId}
                            </span>
                        </span>
                        <button
                            onClick={leaveRoom}
                            className="rounded border-2 border-neutral-600 px-3 py-1 text-sm text-stone-900 hover:bg-stone-100 bg-red-800"
                        >
                            Leave
                        </button>
                    </div>
                )}

                <CustomizationPanel
                    mawashiColor={mawashiColor}
                    dohyoTheme={dohyoTheme}
                    environment={environment}
                    onUpdate={updateCustomization}
                />

                {errorMessage && (
                    <p className="text-sm text-red-700">{errorMessage}</p>
                )}
                {systemMessage && !errorMessage && (
                    <p className="text-sm text-green-700">{systemMessage}</p>
                )}
                {roundResultMessage && (
                    <p className="text-sm font-medium text-yellow-700">
                        {roundResultMessage}
                    </p>
                )}

                <div className="relative h-[70vh] overflow-hidden border-2 border-natural-600">
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
                            environment={environment}
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
