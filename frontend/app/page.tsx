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
        <main className="text-stone-900">
            {/* ── Hero ── */}
            <section className="relative overflow-hidden">
                {/* Aged paper effect */}
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute left-1/3 top-0 h-96 w-96 rounded-full bg-red-700/8 blur-[120px]" />
                    <div className="absolute right-1/3 bottom-0 h-80 w-80 rounded-full bg-amber-700/8 blur-[100px]" />
                </div>

                {/* Yellow gradient backdrop for text */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="h-[600px] w-full max-w-3xl rounded-full bg-gradient-to-r from-yellow-200/30 via-yellow-100/40 to-yellow-200/30 blur-3xl" />
                </div>

                <div className="pointer-events-none absolute inset-3 flex items-center justify-center">
                    <div className="h-[600px] w-full max-w-3xl rounded-full bg-gradient-to-r from-yellow-200/30 via-yellow-100/40 to-yellow-200/30 blur-3xl" />
                </div>

                <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col items-center justify-center gap-8 px-6 py-24 text-center">
                    <div className="inline-flex items-center gap-2 border-2 border-red-800/40 bg-red-800/8 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-red-900">
                        a 42 School Project
                    </div>

                    <h1 className="text-5xl font-bold tracking-tight text-stone-950 sm:text-6xl lg:text-7xl">
                        Step into the{' '}
                        <span className="text-red-900">Dohyo</span>
                    </h1>

                    <p className="max-w-xl text-lg text-stone-700">
                        SumoVerse is a real-time 3D sumo wrestling game. Face
                        off against friends, climb the rankings, and prove you
                        are the last one standing.
                    </p>

                    <p className="text-xs text-stone-600">
                        By using SumoVerse you agree to our{' '}
                        <Link
                            href="/terms"
                            className="underline underline-offset-2 transition hover:text-stone-800"
                        >
                            Terms of Service
                        </Link>{' '}
                        and{' '}
                        <Link
                            href="/privacy"
                            className="underline underline-offset-2 transition hover:text-stone-800"
                        >
                            Privacy Policy
                        </Link>
                        .
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-4">
                        {isLoggedIn ? (
                            <Link
                                href="/lobby"
                                className="bg-red-800 px-7 py-3 text-sm font-semibold text- shadow-lg shadow-red-900/20 transition hover:bg-red-800"
                            >
                                Enter SumoVerse
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href="/signup"
                                    className="bg-red-800 px-7 py-3 text-sm font-semibold text- shadow-lg shadow-red-900/20 transition hover:bg-red-900"
                                >
                                    Create Account
                                </Link>
                                <Link
                                    href="/login"
                                    className="border-2 border-stone-400 px-7 py-3 text-sm font-semibold text-stone-900 transition bg-yellow-100 hover:border-stone-600 hover:bg-stone-200"
                                >
                                    Log In
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </section>

            {/* ── Features ── */}
            <section className="relative mx-auto max-w-5xl px-6 py-24 overflow-hidden">
                <div className="pointer-events-none absolute inset-0 top-0 flex items-start justify-center">
                    <div className="h-[400px] w-full max-w-3xl rounded-full bg-gradient-to-r from-yellow-200/30 via-yellow-100/40 to-yellow-200/30 blur-3xl" />
                </div>
                <div className="relative">
                    <p className="mb-3 text-center text-xs uppercase tracking-[0.3em] text-stone-800 ">
                        What&apos;s inside
                    </p>

                    <h2 className="mb-12 text-center text-2xl font-semibold tracking-tight text-stone-950 sm:text-3xl ">
                        Everything you need to compete
                    </h2>
                </div>
                <div className="relative grid gap-5 sm:grid-cols-2">
                    {features.map((f) => (
                        <div
                            key={f.title}
                            className="border-2 border-stone-300 bg-yellow-100/90 p-6 transition hover:border-stone-400 hover:shadow-md hover:shadow-red-900/10"
                        >
                            <div className="mb-3 text-2xl">{f.icon}</div>
                            <h3 className="mb-1.5 font-semibold text-stone-900">
                                {f.title}
                            </h3>
                            <p className="text-sm leading-relaxed text-stone-700">
                                {f.description}
                            </p>
                        </div>
                    ))}
                </div>
            </section>
        </main>
    );
}
