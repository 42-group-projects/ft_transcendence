'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
    apiGetMe,
    apiGetRanking,
    type RankingEntry,
    type User,
} from '@/lib/api';

function medalColor(rank: number) {
    if (rank === 1) return 'text-yellow-600';
    if (rank === 2) return 'text-stone-400';
    if (rank === 3) return 'text-amber-700';
    return 'text-stone-500';
}

function Avatar({
    nickname,
    avatarUrl,
}: {
    nickname: string;
    avatarUrl: string | null;
}) {
    const [failed, setFailed] = useState(false);
    if (avatarUrl && !failed) {
        return (
            <img
                src={avatarUrl}
                alt={nickname}
                className="h-8 w-8 border-2 border-neutral-600 object-cover"
                onError={() => setFailed(true)}
            />
        );
    }
    return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-stone-400 bg-amber-50 text-xs font-semibold text-stone-700">
            {nickname.slice(0, 1).toUpperCase()}
        </div>
    );
}

export default function RankingPage() {
    const [ranking, setRanking] = useState<RankingEntry[]>([]);
    const [me, setMe] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                setLoading(true);
                const [rankRes, meRes] = await Promise.allSettled([
                    apiGetRanking(),
                    apiGetMe(),
                ]);
                if (cancelled) return;
                if (rankRes.status === 'fulfilled')
                    setRanking(rankRes.value.ranking);
                if (meRes.status === 'fulfilled') setMe(meRes.value.user);
                if (rankRes.status === 'rejected')
                    setError('Failed to load leaderboard.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <main className="min-h-screen bg-yellow-50 px-4 py-6 text-stone-900 sm:px-6 lg:px-8">
            <section className="mx-auto w-full max-w-2xl">
                <p className="text-sm uppercase tracking-[0.3em] text-stone-700">
                    Ranking
                </p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-950">
                    Leaderboard
                </h1>
                <p className="mt-2 text-sm text-stone-700">
                    Sorted by rating · PvP matches only affect rating
                </p>

                {loading && <p className="mt-6 text-stone-600">Loading…</p>}
                {error && <p className="mt-6 text-sm text-red-700">{error}</p>}

                {!loading && !error && (
                    <div className="mt-6 overflow-hidden border-2 border-stone-300 bg-amber-50">
                        {ranking.length === 0 ? (
                            <p className="p-6 text-sm text-stone-700">
                                No players ranked yet. Play a PvP match!
                            </p>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b-2 border-stone-300 bg-amber-100">
                                        <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-stone-700 w-10">
                                            #
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs uppercase tracking-wider text-stone-700">
                                            Player
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-stone-700">
                                            W
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-stone-700">
                                            L
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs uppercase tracking-wider text-stone-700">
                                            Rating
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ranking.map((entry) => {
                                        const isMe = me?.id === entry.id;
                                        return (
                                            <tr
                                                key={entry.id}
                                                className={`border-b border-stone-200 transition-colors ${
                                                    isMe
                                                        ? 'bg-red-900/15'
                                                        : 'hover:bg-amber-100/50'
                                                }`}
                                            >
                                                <td
                                                    className={`px-4 py-3 font-bold tabular-nums ${medalColor(entry.rank)}`}
                                                >
                                                    {entry.rank}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2.5">
                                                        <Avatar
                                                            nickname={
                                                                entry.nickname
                                                            }
                                                            avatarUrl={
                                                                entry.avatar_url
                                                            }
                                                        />
                                                        <span
                                                            className={`font-medium ${isMe ? 'text-red-900' : 'text-stone-900'}`}
                                                        >
                                                            {entry.nickname}
                                                            {isMe && (
                                                                <span className="ml-2 text-xs text-red-900 font-normal">
                                                                    (you)
                                                                </span>
                                                            )}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right tabular-nums text-green-700">
                                                    {entry.wins}
                                                </td>
                                                <td className="px-4 py-3 text-right tabular-nums text-red-400">
                                                    {entry.losses}
                                                </td>
                                                <td className="px-4 py-3 text-right tabular-nums font-semibold text-red-900">
                                                    {entry.rating}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                <div className="mt-8 flex items-center justify-center gap-3">
                    <Link
                        href="/lobby"
                        className="bg-red-900 px-5 py-2.5 text-sm font-semibold text-yellow-50 transition hover:bg-red-800"
                    >
                        Back to Lobby
                    </Link>
                    <Link
                        href="/career"
                        className="border-2 border-neutral-600 px-5 py-2.5 text-sm font-semibold text-stone-900 transition hover:border-stone-700 hover:bg-stone-100"
                    >
                        My Match History
                    </Link>
                </div>
            </section>
        </main>
    );
}
