'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { FriendsSidebar } from '@/app/lobby/components/FriendsSidebar';
import {
    apiGetMe,
    apiGetMyStats,
    getAvatarUrl,
    type User,
    type UserStats,
} from '@/lib/api';
import { usePresenceSocket } from '@/app/components/PresenceProvider';

const roomLinks = [
    {
        href: '/game/solo',
        title: 'Practice room',
        description: 'Practice movement, test AI levels, and warm up offline.',
        accentClassName:
            'border-red-800/90 bg-red-800/10 text-stone-800  hover:bg-red-800/40',
    },
    {
        href: '/profile',
        title: 'Profile',
        description: 'View and edit your profile details and avatar settings.',
        accentClassName:
            'border-green-800/80 bg-green-600/10 text-green-800 hover:bg-green-600/20',
    },
    {
        href: '/career',
        title: 'Career',
        description: 'Check milestones, progress, and future career unlocks.',
        accentClassName:
            'border-purple-900/90 bg-purple-800/10 text-stone-800 hover:bg-purple-900/20',
    },
    {
        href: '/ranking',
        title: 'Ranking',
        description: 'See leaderboard standings and competitive ranking info.',
        accentClassName:
            'border-blue-900/90 bg-blue-900/10 text-stone-800 hover:bg-blue-900/40',
    },
];

function getRankLabel(rating: number | undefined) {
    if (rating === undefined) return 'Rookie Wrestler';
    if (rating >= 1500) return 'Yokozuna';
    if (rating >= 1250) return 'Ozeki';
    if (rating >= 1050) return 'Sekiwake';
    return 'Rookie Wrestler';
}

export default function LobbyPage() {
    const [user, setUser] = useState<User | null>(null);
    const [stats, setStats] = useState<UserStats | null>(null);
    const [hasActiveSession, setHasActiveSession] = useState(false);

    const socket = usePresenceSocket();

    useEffect(() => {
        if (!socket) return;

        const onActive = () => setHasActiveSession(true);
        const onEnded = () => setHasActiveSession(false);

        socket.on('hasActiveSession', onActive);
        socket.on('sessionEnded', onEnded);
        socket.on('roomTimeout', onEnded);

        socket.emit(
            'checkActiveSession',
            ({ active }: { active: boolean; opponentId: string | null }) => {
                setHasActiveSession(active);
            },
        );

        // Re-check on tab focus as a safety net for timeouts that fired
        // while the user was away.
        const onVisible = () => {
            if (document.visibilityState !== 'visible') return;
            socket.emit(
                'checkActiveSession',
                ({
                    active,
                }: {
                    active: boolean;
                    opponentId: string | null;
                }) => {
                    setHasActiveSession(active);
                },
            );
        };
        document.addEventListener('visibilitychange', onVisible);

        return () => {
            socket.off('hasActiveSession', onActive);
            socket.off('sessionEnded', onEnded);
            socket.off('roomTimeout', onEnded);
            document.removeEventListener('visibilitychange', onVisible);
        };
    }, [socket]);

    useEffect(() => {
        let cancelled = false;

        const loadLobbyProfile = async () => {
            try {
                const [meResponse, statsResponse] = await Promise.all([
                    apiGetMe(),
                    apiGetMyStats(),
                ]);
                if (cancelled) return;
                setUser(meResponse.user);
                setStats(statsResponse.stats);
            } catch {
                if (cancelled) return;
                setUser(null);
                setStats(null);
            }
        };

        loadLobbyProfile();

        return () => {
            cancelled = true;
        };
    }, []);

    const avatarInitials = user?.nickname
        ? user.nickname.slice(0, 2).toUpperCase()
        : 'PO';

    const displayName = user?.nickname ?? 'Player One';
    const rankLabel = getRankLabel(stats?.rating);

    return (
        <main className="min-h-screen px-2 py-6 text-stone-900 sm:px-6 lg:px-8 relative overflow-hidden">
            <div className="pointer-events-none fixed inset-0 -z-10">
                <div className="absolute -top-40 -left-40 h-[800px] w-[1200px] rounded-full bg-gradient-to-r from-yellow-200/25 via-yellow-100/30 to-yellow-200/20 blur-3xl" />
                <div className="absolute -bottom-32  h-[800px] w-[800px] rounded-full bg-gradient-to-l from-yellow-200/25 via-yellow-100/35 to-yellow-200/20 blur-3xl" />
            </div>
            <section className="relative mx-auto flex min-h-[calc(100vh-6.5rem)] w-full max-w-6xl flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm uppercase tracking-[0.3em] text-stone-800">
                            Lobby
                        </p>
                        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-950">
                            Choose your next match
                        </h1>
                    </div>
                    <Link
                        href="/"
                        className="border-2 border-stone-400 bg-red-800 px-4 py-2 text-sm font-medium text-stone-900 transition hover:bg-stone-200"
                    >
                        Back home
                    </Link>
                </div>

                <div className="relative flex-1 overflow-hidden shadow-lg">
                    <FriendsSidebar />
                    <div className="relative z-10 flex h-full flex-col p-4 sm:p-6 md:pr-80">
                        <div className="flex flex-wrap gap-2 lg:gap-3">
                            {roomLinks.map((room) => {
                                const isSolo = room.href === '/game/solo';
                                const disabled = isSolo && hasActiveSession;
                                return disabled ? (
                                    <div
                                        key={room.href}
                                        title="You are already in an active match"
                                        className={`w-full min-w-0 cursor-not-allowed border-2 px-3 py-3 text-left opacity-40 sm:w-[calc(50%-0.25rem)] lg:w-[calc(20%-0.6rem)] ${room.accentClassName}`}
                                    >
                                        <span className="block text-sm font-semibold">
                                            {room.title}
                                        </span>
                                        <span className="mt-1 block text-xs text-stone-600">
                                            You're in an active match.join your
                                            match or refresh to see if the game
                                            ended.
                                        </span>
                                    </div>
                                ) : (
                                    <Link
                                        key={room.href}
                                        href={room.href}
                                        className={`w-full min-w-0 border-2 px-3 py-3 text-left backdrop-blur-sm text-stone-900 ${room.accentClassName}`}
                                    >
                                        <span className="block text-sm font-semibold">
                                            {room.title}
                                        </span>
                                        <span className="mt-1 block text-xs text-stone-600">
                                            {room.description}
                                        </span>
                                    </Link>
                                );
                            })}
                        </div>

                        <div className="flex flex-1 items-start justify-center py-6 md:items-center md:py-8 ">
                            <div
                                style={{
                                    backgroundImage:
                                        'linear-gradient(rgba(253, 244, 191, 0.4), rgba(253, 244, 191, 0.4)), url(/washi.jpg)',
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                }}
                                className="w-full max-w-xs border-2 border-stone-400 p-6 text-center shadow-lg shadow-red-900/10 backdrop-blur-sm sm:max-w-sm sm:p-8"
                            >
                                <img
                                    src={getAvatarUrl(user?.avatar_url)}
                                    alt={`${displayName} avatar`}
                                    className="mx-auto h-28 w-28 border-4 border-stone-400 object-cover shadow-md shadow-stone-400/30 sm:h-32 sm:w-32"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src =
                                            getAvatarUrl(null);
                                    }}
                                />
                                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-stone-900">
                                    {displayName}
                                </h2>
                                <p className="mt-2 text-sm text-stone-700">
                                    {rankLabel}
                                </p>
                                {stats ? (
                                    <p className="mt-2 text-xs text-stone-600">
                                        Wins {stats.wins} • Losses{' '}
                                        {stats.losses} • Rating {stats.rating}
                                    </p>
                                ) : null}

                                <Link
                                    href="/profile"
                                    className="mt-6 inline-flex border-2 border-stone-400 px-5 py-3 text-sm font-medium text-stone-900 transition hover:bg-stone-200"
                                >
                                    Edit profile / avatar
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
