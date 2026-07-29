'use client';

import { AuthCard } from '@/app/components/AuthCard';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { apiSignup, saveToken, getFriendlyErrorMessage } from '@/lib/api';

export default function SignupPage() {
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [statusMessage, setStatusMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setStatusMessage('');

        if (password !== confirmPassword) {
            setStatusMessage('Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            const { access_token } = await apiSignup(
                email,
                displayName,
                password,
            );
            saveToken(access_token);
            router.push('/lobby');
        } catch (err) {
            const rawMessage =
                err instanceof Error ? err.message : 'Signup failed';
            setStatusMessage(getFriendlyErrorMessage(rawMessage));
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="relative min-h-screen bg- text-stone-900 overflow-hidden">
            <div className="pointer-events-none fixed inset-0 -z-10">
                <div className="absolute -top-10 -left-10 h-[400px] w-[400px] rounded-full bg-gradient-to-r from-yellow-200/25 via-yellow-100/30 to-yellow-200/20 blur-3xl" />
                <div className="absolute -bottom-10 -right-10 h-[400px] w-[400px] rounded-full bg-gradient-to-l from-yellow-200/25 via-yellow-100/35 to-yellow-200/20 blur-3xl" />
            </div>
            <section className="relative mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12">
                <AuthCard
                    accentLabel="SumoVerse"
                    accentColorClassName="text-red-900"
                    title="Create account"
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
                                href="/login"
                                className="text-red-900 transition hover:text-red-800"
                            >
                                Already have an account?
                            </Link>
                        </>
                    }
                >
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <label className="block">
                            <span className="mb-2 block text-sm font-medium text-stone-900">
                                Display name
                            </span>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(event) =>
                                    setDisplayName(event.target.value)
                                }
                                placeholder="Display Name"
                                className="w-full border-2 border-stone-300 bg-yellow-50 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-red-900 focus:ring-2 focus:ring-red-900/10"
                                required
                            />
                        </label>

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
                                required
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
                                required
                            />
                        </label>

                        <label className="block">
                            <span className="mb-2 block text-sm font-medium text-stone-900">
                                Confirm password
                            </span>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(event) =>
                                    setConfirmPassword(event.target.value)
                                }
                                placeholder="••••••••"
                                className="w-full border-2 border-stone-300 bg-yellow-50 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-red-900 focus:ring-2 focus:ring-red-900/10"
                                required
                            />
                        </label>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-red-800 px-4 py-3 text-sm font-semibold text- transition hover:bg-red-900 disabled:opacity-50"
                        >
                            {loading ? 'Creating account…' : 'Sign up'}
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
