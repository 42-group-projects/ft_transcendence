'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Canvas } from '@react-three/fiber';

import { GameResultOverlay } from '@/app/game/components/GameResultOverlay';
import { CountdownOverlay } from '@/app/game/components/CountdownOverlay';
import { GameLobbyControls } from '../components/GameLobbyControls';
import { WorldScene } from '../components/WorldScene';
import { useGameSession } from '../hooks/useGameSession';
import { useMovementInput } from '../hooks/useMovementInput';
import { useDashCooldown } from '../hooks/useDashCooldown';
import { FrameRateDisplay } from '../components/FrameRateDispay';
import { CustomizationPanel } from '../components/CustomizationPanel';
import { FpsCounter } from '../utils/FpsCounter';
import { useCustomization } from '../hooks/useCustomization';
import { usePresenceSocket } from '@/app/components/PresenceProvider';
import { apiGetFriends, apiGetMe } from '@/lib/api';
import { usePresence } from '@/app/lobby/hooks/usePresence';

export default function GamePage() {
    const [name, setName] = useState('Player');
    const [roomId, setRoomId] = useState('');
    const [password, setPassword] = useState('');
    const [fps, setFps] = useState(0);
    const searchParams = useSearchParams();
    const autoJoinFiredRef = useRef(false);

    // Invite-a-friend state
    const socket = usePresenceSocket();
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

    const {
        mawashiColor,
        dohyoTheme,
        update: updateCustomization,
    } = useCustomization();
    const dashCooldownTotalMs = gameConstants?.DASH_COOLDOWN_MS ?? 800;
    const { dashCooldownMs, triggerDash } =
        useDashCooldown(dashCooldownTotalMs);
    useMovementInput({ joinedRoomId, socketRef, onDash: triggerDash });

    // Auto-join when arriving from an invite link (?join=roomId&pw=password)
    useEffect(() => {
        if (autoJoinFiredRef.current || !connected || joinedRoomId) return;
        const inviteRoomId = searchParams.get('join');
        const invitePassword = searchParams.get('pw');
        if (!inviteRoomId || !invitePassword) return;
        autoJoinFiredRef.current = true;
        joinRoom({ roomId: inviteRoomId, password: invitePassword, name });
    }, [connected, joinedRoomId, searchParams, name, joinRoom]);

    // Auto-create room when arriving from a challenge link (?challenge=userId&pw=password)
    const challengeFiredRef = useRef(false);
    useEffect(() => {
        if (challengeFiredRef.current || !connected || joinedRoomId) return;
        const challengeTarget = searchParams.get('challenge');
        const challengePw = searchParams.get('pw');
        if (!challengeTarget || !challengePw) return;
        challengeFiredRef.current = true;
        createRoom({ name, password: challengePw });
    }, [connected, joinedRoomId, searchParams, name, createRoom]);

    // Once the room exists (created via challenge), send the invite
    const challengeInviteSentRef = useRef(false);
    useEffect(() => {
        if (challengeInviteSentRef.current || !joinedRoomId || !socket) return;
        const challengeTarget = searchParams.get('challenge');
        const challengePw = searchParams.get('pw');
        if (!challengeTarget || !challengePw) return;
        challengeInviteSentRef.current = true;
        socket.emit('sendRoomInvite', { toUserId: challengeTarget, roomId: joinedRoomId, password: challengePw });
    }, [joinedRoomId, socket, searchParams]);

    const handleSendInvite = (toUserId: string) => {
        if (!socket || !joinedRoomId || !password) return;
        socket.emit('sendRoomInvite', { toUserId, roomId: joinedRoomId, password });
        setInviteSentTo(toUserId);
        setTimeout(() => setInviteSentTo(null), 3000);
        setShowInviteMenu(false);
    };

    const handleCreateRoom = () => {
        createRoom({ name, password });
    };

    const handleJoinRoom = () => {
        joinRoom({ roomId, password, name });
    };

    const showGameResult = sessionEndedReason === 'game_finished';
    const resultTitle = roundResultMessage ?? 'Match finished';

    return (
        <main className="min-h-screen bg-neutral-950 text-neutral-100">
            <section className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">
                        Multiplayer Room
                    </h1>
                    <div className="flex items-center gap-2">
                        <Link
                            href="/lobby"
                            className="rounded-md border border-neutral-700 px-3 py-1.5 text-xs font-medium text-neutral-200 transition hover:bg-neutral-900"
                        >
                            Back to Lobby
                        </Link>
                    </div>
                </div>

                <CustomizationPanel
                    mawashiColor={mawashiColor}
                    dohyoTheme={dohyoTheme}
                    onUpdate={updateCustomization}
                />

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

                {sessionEndedReason === 'room_timeout' && (
                    <div className="flex items-center justify-between rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
                        <span> Return to lobby?</span>
                        <Link
                            href="/lobby"
                            className="ml-4 shrink-0 rounded border border-amber-500/40 px-3 py-1 text-xs font-medium text-amber-300 transition hover:bg-amber-500/20"
                        >
                            Back to Lobby
                        </Link>
                    </div>
                )}

                <div className="relative h-[72vh] overflow-hidden rounded-lg border border-neutral-700">
                    <Canvas shadows camera={{ position: [0, 8, 10], fov: 55 }}>
                        <FpsCounter setFps={setFps} />
                        <WorldScene
                            players={players}
                            localPlayerId={localPlayerId}
                            gameConstants={gameConstants}
                            dashCooldownMs={dashCooldownMs}
                            dashCooldownTotalMs={dashCooldownTotalMs}
                            mawashiColor={mawashiColor}
                            dohyoTheme={dohyoTheme}
                        />
                    </Canvas>
                    <FrameRateDisplay fps={fps} />
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
            </section>
        </main>
    );
}
