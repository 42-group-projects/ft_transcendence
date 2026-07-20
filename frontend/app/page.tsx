'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getToken } from '@/lib/api';

const features = [
    {
        title: 'Real-time Multiplayer',
        description:
            'Challenge friends or jump into a shared room and compete live against other players.',
        icon: '⚡',
    },
    {
        title: 'Practice Match',
        description:
            'Sharpen your technique against CPU opponents at adjustable difficulty levels.',
        icon: '🥋',
    },
    {
        title: 'Friend System',
        description:
            'Add friends, see who is online, send direct messages, and challenge them instantly.',
        icon: '👥',
    },
    {
        title: 'Rankings & Stats',
        description:
            'Earn rating points from every match and climb the global leaderboard.',
        icon: '🏆',
    },
];

export default function Home() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        setIsLoggedIn(Boolean(getToken()));
        const sync = () => setIsLoggedIn(Boolean(getToken()));
        window.addEventListener('auth-changed', sync);
        return () => window.removeEventListener('auth-changed', sync);
    }, []);

    return (
        <main className="bg-neutral-950 text-neutral-100">
            {/* ── Hero ── */}
            <section className="relative overflow-hidden">
                {/* Background glows */}
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-orange-500/10 blur-[120px]" />
                    <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-blue-500/10 blur-[80px]" />
                </div>

                <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col items-center justify-center gap-8 px-6 py-24 text-center">
                    <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-orange-400">
                        a 42 School Project
                    </div>

                    <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
                        Step into the{' '}
                        <span className="bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">
                            Dohyo
                        </span>
                    </h1>

                    <p className="max-w-xl text-lg text-neutral-400">
                        SumoVerse is a real-time 3D sumo wrestling game. Face
                        off against friends, climb the rankings, and prove you
                        are the last one standing.
                    </p>

                    <p className="text-xs text-neutral-500">
                        By using SumoVerse you agree to our{' '}
                        <Link
                            href="/terms"
                            className="underline underline-offset-2 transition hover:text-neutral-300"
                        >
                            Terms of Service
                        </Link>{' '}
                        and{' '}
                        <Link
                            href="/privacy"
                            className="underline underline-offset-2 transition hover:text-neutral-300"
                        >
                            Privacy Policy
                        </Link>
                        .
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-4">
                        {isLoggedIn ? (
                            <Link
                                href="/lobby"
                                className="rounded-lg bg-orange-500 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-400"
                            >
                                Enter SumoVerse
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href="/signup"
                                    className="rounded-lg bg-orange-500 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-400"
                                >
                                    Create Account
                                </Link>
                                <Link
                                    href="/login"
                                    className="rounded-lg border border-neutral-700 px-7 py-3 text-sm font-semibold text-neutral-200 transition hover:border-neutral-500 hover:text-white"
                                >
                                    Log In
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </section>

            {/* ── Features ── */}
            <section className="mx-auto max-w-5xl px-6 py-24">
                <p className="mb-3 text-center text-xs uppercase tracking-[0.3em] text-neutral-500">
                    What&apos;s inside
                </p>
                <h2 className="mb-12 text-center text-2xl font-semibold tracking-tight sm:text-3xl">
                    Everything you need to compete
                </h2>

                <div className="grid gap-5 sm:grid-cols-2">
                    {features.map((f) => (
                        <div
                            key={f.title}
                            className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 transition hover:border-neutral-700"
                        >
                            <div className="mb-3 text-2xl">{f.icon}</div>
                            <h3 className="mb-1.5 font-semibold text-neutral-100">
                                {f.title}
                            </h3>
                            <p className="text-sm leading-relaxed text-neutral-400">
                                {f.description}
                            </p>
                        </div>
                    ))}
                </div>
            </section>
        </main>
    );
}
