'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
    apiGetMe,
    apiGetMyMatches,
    apiGetMyStats,
    type MatchRecord,
    type User,
    type UserStats,
} from '@/lib/api';

function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    4;

    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}

function MatchRow({ match, myId }: { match: MatchRecord; myId: string }) {
    const won = match.winner_id === myId;
    const isCpu = match.is_cpu_game;

    const opponentNickname =
        match.player1_id === myId
            ? (match.player2_nickname ?? (isCpu ? 'CPU' : 'Unknown'))
            : match.player1_nickname;

    return (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-neutral-800 bg-neutral-950/60 px-4 py-3 text-sm">
            <div className="flex items-center gap-3 min-w-0">
                <span
                    className={`inline-flex shrink-0 items-center rounded px-2 py-0.5 text-xs font-semibold ${
                        won
                            ? 'bg-green-900/60 text-green-300'
                            : 'bg-red-900/60 text-red-400'
                    }`}
                >
                    {won ? 'WIN' : 'LOSS'}
                </span>
                <span className="truncate text-neutral-200">
                    vs <span className="font-medium">{opponentNickname}</span>
                    {isCpu && (
                        <span className="ml-1.5 rounded bg-neutral-800 px-1.5 py-0.5 text-xs text-neutral-400">
                            CPU
                        </span>
                    )}
                </span>
            </div>
            <span className="shrink-0 text-neutral-500 tabular-nums">
                {timeAgo(match.played_at)}
            </span>
        </div>
    );
}

export default function CareerPage() {
    const [user, setUser] = useState<User | null>(null);
    const [stats, setStats] = useState<UserStats | null>(null);
    const [matches, setMatches] = useState<MatchRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                setLoading(true);
                const [meRes, statsRes, matchRes] = await Promise.all([
                    apiGetMe(),
                    apiGetMyStats(),
                    apiGetMyMatches(30),
                ]);
                if (cancelled) return;
                setUser(meRes.user);
                setStats(statsRes.stats);
                setMatches(matchRes.matches);
            } catch (err) {
                if (!cancelled)
                    setError(
                        err instanceof Error ? err.message : 'Failed to load.',
                    );
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    const winRate =
        stats && stats.wins + stats.losses > 0
            ? Math.round((stats.wins / (stats.wins + stats.losses)) * 100)
            : 0;

    return (
        <main className="min-h-screen bg-neutral-950 px-4 py-6 text-neutral-100 sm:px-6 lg:px-8">
            <section className="mx-auto w-full max-w-2xl">
                <p className="text-sm uppercase tracking-[0.3em] text-neutral-500">
                    Career
                </p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight">
                    Match History
                </h1>

                {loading && <p className="mt-6 text-neutral-400">Loading…</p>}
                {error && <p className="mt-6 text-sm text-red-400">{error}</p>}

                {!loading && !error && (
                    <>
                        {stats && (
                            <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                                <div className="rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-4">
                                    <p className="text-2xl font-bold text-green-400">
                                        {stats.wins}
                                    </p>
                                    <p className="mt-1 text-xs text-neutral-500 uppercase tracking-wider">
                                        Wins
                                    </p>
                                </div>
                                <div className="rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-4">
                                    <p className="text-2xl font-bold text-red-400">
                                        {stats.losses}
                                    </p>
                                    <p className="mt-1 text-xs text-neutral-500 uppercase tracking-wider">
                                        Losses
                                    </p>
                                </div>
                                <div className="rounded-xl border border-neutral-800 bg-neutral-900 px-4 py-4">
                                    <p className="text-2xl font-bold text-blue-400">
                                        {stats.rating}
                                    </p>
                                    <p className="mt-1 text-xs text-neutral-500 uppercase tracking-wider">
                                        Rating
                                    </p>
                                </div>
                            </div>
                        )}

                        {stats && stats.wins + stats.losses > 0 && (
                            <div className="mt-4">
                                <div className="mb-1 flex justify-between text-xs text-neutral-500">
                                    <span>Win rate</span>
                                    <span>{winRate}%</span>
                                </div>
                                <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-800">
                                    <div
                                        className="h-2 rounded-full bg-green-500 transition-all"
                                        style={{ width: `${winRate}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="mt-8">
                            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-400">
                                Recent matches
                            </h2>
                            {matches.length === 0 ? (
                                <p className="text-sm text-neutral-500">
                                    No matches yet. Play a game to see your
                                    history here!
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {matches.map((m) => (
                                        <MatchRow
                                            key={m.id}
                                            match={m}
                                            myId={user?.id ?? ''}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}

                <div className="mt-8 flex items-center justify-center gap-3">
                    <Link
                        href="/lobby"
                        className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
                    >
                        Back to Lobby
                    </Link>
                    <Link
                        href="/ranking"
                        className="rounded-md border border-neutral-700 px-5 py-2.5 text-sm font-semibold text-neutral-300 transition hover:border-neutral-500 hover:text-white"
                    >
                        Leaderboard →
                    </Link>
                </div>
            </section>
        </main>
    );
}
