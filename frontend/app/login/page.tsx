'use client';

import { AuthCard } from '@/app/components/AuthCard';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { apiLogin, saveToken, getFriendlyErrorMessage } from '@/lib/api';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [statusMessage, setStatusMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        setStatusMessage('');
        try {
            const { access_token } = await apiLogin(email, password);
            saveToken(access_token);
            router.push('/lobby');
        } catch (err) {
            const rawMessage =
                err instanceof Error ? err.message : 'Login failed';
            setStatusMessage(getFriendlyErrorMessage(rawMessage));
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-neutral-950 text-neutral-100">
            <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center px-6 py-12">
                <AuthCard
                    accentLabel="SumoVerse"
                    accentColorClassName="text-blue-400"
                    title="Sign in"
                    description="Temporary UI only. This form is ready for future API wiring."
                    footer={
                        <>
                            <Link
                                href="/"
                                className="transition hover:text-neutral-200"
                            >
                                Back home
                            </Link>
                            <Link
                                href="/signup"
                                className="text-blue-400 transition hover:text-blue-300"
                            >
                                Create account
                            </Link>
                        </>
                    }
                >
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <label className="block">
                            <span className="mb-2 block text-sm font-medium text-neutral-200">
                                Email
                            </span>
                            <input
                                type="email"
                                value={email}
                                onChange={(event) =>
                                    setEmail(event.target.value)
                                }
                                placeholder="you@example.com"
                                className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                                required
                            />
                        </label>

                        <label className="block">
                            <span className="mb-2 block text-sm font-medium text-neutral-200">
                                Password
                            </span>
                            <input
                                type="password"
                                value={password}
                                onChange={(event) =>
                                    setPassword(event.target.value)
                                }
                                placeholder="••••••••"
                                className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                                required
                            />
                        </label>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
                        >
                            {loading ? 'Signing in…' : 'Sign in'}
                        </button>
                    </form>
                    {statusMessage ? (
                        <p className="mt-4 text-sm text-amber-400">
                            {statusMessage}
                        </p>
                    ) : null}
                </AuthCard>
            </section>
        </main>
    );
}
