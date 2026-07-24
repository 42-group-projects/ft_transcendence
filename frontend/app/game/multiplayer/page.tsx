'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Canvas } from '@react-three/fiber';

import { GameResultOverlay } from '@/app/game/components/GameResultOverlay';
import { CountdownOverlay } from '@/app/game/components/CountdownOverlay';
import DashCooldownIndicator from '../components/DashCooldownIndicator';
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
import { apiGetMe } from '@/lib/api';

export default function GamePage() {
    const [myNickname, setMyNickname] = useState<string | undefined>();
    const [roomId, setRoomId] = useState('');
    const [password, setPassword] = useState('');
    const [fps, setFps] = useState(0);
    const searchParams = useSearchParams();
    const autoJoinFiredRef = useRef(false);

    const socket = usePresenceSocket();

    useEffect(() => {
        apiGetMe()
            .then(({ user }) => {
                if (user?.nickname) setMyNickname(user.nickname);
            })
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
        if (
            autoJoinFiredRef.current ||
            !connected ||
            joinedRoomId ||
            !myNickname
        )
            return;
        const inviteRoomId = searchParams.get('join');
        const invitePassword = searchParams.get('pw');
        if (!inviteRoomId || !invitePassword) return;
        autoJoinFiredRef.current = true;
        joinRoom({
            roomId: inviteRoomId,
            password: invitePassword,
            name: myNickname,
        });
    }, [connected, joinedRoomId, searchParams, myNickname, joinRoom]);

    // Auto-create room when arriving from a challenge link (?challenge=userId&pw=password)
    const challengeFiredRef = useRef(false);
    useEffect(() => {
        if (
            challengeFiredRef.current ||
            !connected ||
            joinedRoomId ||
            !myNickname
        )
            return;
        const challengeTarget = searchParams.get('challenge');
        const challengePw = searchParams.get('pw');
        if (!challengeTarget || !challengePw) return;
        challengeFiredRef.current = true;
        createRoom({ name: myNickname, password: challengePw });
    }, [connected, joinedRoomId, searchParams, myNickname, createRoom]);

    // Once the room exists (created via challenge), send the invite
    const challengeInviteSentRef = useRef(false);
    useEffect(() => {
        if (challengeInviteSentRef.current || !joinedRoomId || !socket) return;
        const challengeTarget = searchParams.get('challenge');
        const challengePw = searchParams.get('pw');
        if (!challengeTarget || !challengePw) return;
        challengeInviteSentRef.current = true;
        socket.emit('sendRoomInvite', {
            toUserId: challengeTarget,
            roomId: joinedRoomId,
            password: challengePw,
            fromNickname: myNickname,
        });
    }, [joinedRoomId, socket, searchParams, myNickname]);

    const handleCreateRoom = () => {
        createRoom({ name: myNickname ?? '', password });
    };

    const handleJoinRoom = () => {
        joinRoom({ roomId, password, name: myNickname ?? '' });
    };

    const isSessionOver =
        sessionEndedReason === 'game_finished' ||
        sessionEndedReason === 'room_timeout' ||
        sessionEndedReason === 'disconnect_timeout';

    const resultTitle =
        sessionEndedReason === 'room_timeout'
            ? 'No opponent joined'
            : sessionEndedReason === 'disconnect_timeout'
              ? 'Opponent did not reconnect'
              : (roundResultMessage ?? 'Match finished');
    const resultDescription =
        sessionEndedReason === 'game_finished'
            ? systemMessage
            : 'Returning to lobby…';

    useEffect(() => {
        if (!isSessionOver || sessionEndedReason === 'game_finished') return;
        const t = setTimeout(() => {
            window.location.href = '/lobby';
        }, 4000);
        return () => clearTimeout(t);
    }, [isSessionOver, sessionEndedReason]);

    return (
        <main className="min-h-screen bg- text-stone-900">
            <section className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold text-stone-950">
                        Multiplayer Room
                    </h1>
                    <div className="flex items-center gap-2">
                        <Link
                            href="/lobby"
                            className="border-2 border-neutral-600 px-3 py-1.5 text-xs font-medium text-stone-900 transition hover:bg-stone-100"
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
                    roomId={roomId}
                    password={password}
                    connected={connected}
                    joinedRoomId={joinedRoomId}
                    playersCount={players.length}
                    errorMessage={errorMessage}
                    systemMessage={systemMessage}
                    roundResultMessage={roundResultMessage}
                    onRoomIdChange={setRoomId}
                    onPasswordChange={setPassword}
                    onCreateRoom={handleCreateRoom}
                    onJoinRoom={handleJoinRoom}
                    onLeaveRoom={leaveRoom}
                />

                <div className="relative h-[72vh] overflow-hidden border-2 border-neutral-600">
                    <Canvas shadows camera={{ position: [0, 8, 10], fov: 55 }}>
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
                    {isSessionOver ? (
                        <GameResultOverlay
                            title={resultTitle}
                            description={resultDescription}
                        />
                    ) : null}
                </div>
            </section>
        </main>
    );
}
