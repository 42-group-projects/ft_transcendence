"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { apiSignup, saveToken } from "@/lib/api";

export default function SignupPage() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusMessage("");

    if (password !== confirmPassword) {
      setStatusMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { access_token } = await apiSignup(email, displayName, password);
      saveToken(access_token);
      router.push("/lobby");
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <section className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-12">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/90 p-8 shadow-2xl shadow-black/30">
          <div className="mb-8 text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-orange-400">SumoVerse</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">Create account</h1>
            <p className="mt-3 text-sm text-neutral-400">
              Temporary UI only. This form is ready for future API wiring.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-neutral-200">Display name</span>
              <input
                type="text"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Display Name"
                className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-4 py-3 text-sm outline-none transition focus:border-orange-500"
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-neutral-200">Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-4 py-3 text-sm outline-none transition focus:border-orange-500"
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-neutral-200">Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-4 py-3 text-sm outline-none transition focus:border-orange-500"
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-neutral-200">Confirm password</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-4 py-3 text-sm outline-none transition focus:border-orange-500"
                required
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-orange-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-500 disabled:opacity-50"
            >
              {loading ? "Creating account…" : "Sign up"}
            </button>
          </form>

          {statusMessage ? <p className="mt-4 text-sm text-amber-400">{statusMessage}</p> : null}

          <div className="mt-6 flex items-center justify-between text-sm text-neutral-400">
            <Link href="/" className="transition hover:text-neutral-200">
              Back home
            </Link>
            <Link href="/login" className="text-orange-400 transition hover:text-orange-300">
              Already have an account?
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
