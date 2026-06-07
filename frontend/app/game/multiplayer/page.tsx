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
    const [myId, setMyId] = useState<string | null>(null);
    const [friends, setFriends] = useState<any[]>([]);
    const [showInviteMenu, setShowInviteMenu] = useState(false);
    const [inviteSentTo, setInviteSentTo] = useState<string | null>(null);
    const friendIds = friends.map((f: any) => f.userId);
    const onlineStatuses = usePresence(myId || '', friendIds);

    useEffect(() => {
        apiGetMe()
            .then(({ user }) => {
                if (!user) return undefined;
                setMyId(user.id);
                return apiGetFriends();
            })
            .then((data) => { if (data) setFriends(data); })
            .catch(() => {});
    }, []);
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
                        Multiplayer Prototype
                    </h1>
                    <div className="flex items-center gap-2">
                        {/* Invite a friend — only shown once you've created/joined a room */}
                        {joinedRoomId && friends.length > 0 && (
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setShowInviteMenu((v) => !v)}
                                    className="rounded-md border border-orange-600/50 bg-orange-500/10 px-3 py-1.5 text-xs font-medium text-orange-300 transition hover:bg-orange-500/20"
                                >
                                    Invite Friend
                                </button>
                                {inviteSentTo && (
                                    <p className="absolute right-0 top-8 whitespace-nowrap text-[10px] text-emerald-400">
                                        Invite sent!
                                    </p>
                                )}
                                {showInviteMenu && (
                                    <div className="absolute right-0 top-8 z-50 min-w-[160px] rounded-lg border border-neutral-700 bg-neutral-900 py-1 shadow-xl">
                                        {friends
                                            .filter((f) => {
                                                const s = onlineStatuses[f.userId] || 'offline';
                                                return s === 'online' || s === 'in_game';
                                            })
                                            .map((f) => (
                                                <button
                                                    key={f.userId}
                                                    type="button"
                                                    onClick={() => handleSendInvite(f.userId)}
                                                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-neutral-200 hover:bg-neutral-800 transition"
                                                >
                                                    <span
                                                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                                                            onlineStatuses[f.userId] === 'in_game'
                                                                ? 'bg-blue-400'
                                                                : 'bg-emerald-400'
                                                        }`}
                                                    />
                                                    {f.userId.substring(0, 8)}…
                                                </button>
                                            ))}
                                        {friends.filter((f) => {
                                            const s = onlineStatuses[f.userId] || 'offline';
                                            return s === 'online' || s === 'in_game';
                                        }).length === 0 && (
                                            <p className="px-3 py-2 text-[10px] text-neutral-500">
                                                No friends online.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
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
