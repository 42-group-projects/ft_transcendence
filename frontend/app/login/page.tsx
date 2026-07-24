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
        <main className="min-h-screen bg-yellow-50 text-stone-900">
            <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center px-6 py-12">
                <AuthCard
                    accentLabel="SumoVerse"
                    accentColorClassName="text-red-900"
                    title="Sign in"
                    description="Temporary UI only. This form is ready for future API wiring."
                    footer={
                        <>
                            <Link
                                href="/"
                                className="transition hover:text-stone-700"
                            >
                                Back home
                            </Link>
                            <Link
                                href="/signup"
                                className="text-red-900 transition hover:text-red-800"
                            >
                                Create account
                            </Link>
                        </>
                    }
                >
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <label className="block">
                            <span className="mb-2 block text-sm font-medium text-stone-900">
                                Email
                            </span>
                            <input
                                type="email"
                                value={email}
                                onChange={(event) =>
                                    setEmail(event.target.value)
                                }
                                placeholder="you@example.com"
                                className="w-full border-2 border-stone-300 bg-yellow-50 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-red-900 focus:ring-2 focus:ring-red-900/10"
                            />
                        </label>

                        <label className="block">
                            <span className="mb-2 block text-sm font-medium text-stone-900">
                                Password
                            </span>
                            <input
                                type="password"
                                value={password}
                                onChange={(event) =>
                                    setPassword(event.target.value)
                                }
                                placeholder="••••••••"
                                className="w-full border-2 border-stone-300 bg-yellow-50 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-red-900 focus:ring-2 focus:ring-red-900/10"
                            />
                        </label>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-red-900 px-4 py-3 text-sm font-semibold text-yellow-50 transition hover:bg-red-800 disabled:opacity-50"
                        >
                            {loading ? 'Signing in…' : 'Sign in'}
                        </button>
                    </form>
                    {statusMessage ? (
                        <p className="mt-4 text-sm text-red-800">
                            {statusMessage}
                        </p>
                    ) : null}
                </AuthCard>
            </section>
        </main>
    );
}
