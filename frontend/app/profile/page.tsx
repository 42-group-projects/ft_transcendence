"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiGetMe, apiGetMyStats, type User, type UserStats } from "@/lib/api";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [avatarFailed, setAvatarFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const [meResponse, statsResponse] = await Promise.all([apiGetMe(), apiGetMyStats()]);

        if (cancelled) {
          return;
        }

        setUser(meResponse.user);
        setStats(statsResponse.stats);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load profile data");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-6 text-neutral-100 sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-3xl rounded-2xl border border-neutral-800 bg-neutral-900/90 p-6 sm:p-8">
        <p className="text-sm uppercase tracking-[0.3em] text-neutral-500">Profile</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Your Account Data</h1>
        <p className="mt-3 text-sm text-neutral-400">Values shown below come directly from your mock API.</p>

        {loading ? <p className="mt-6 text-neutral-300">Loading profile...</p> : null}
        {error ? <p className="mt-6 text-sm text-red-400">{error}</p> : null}

        {!loading && !error && user ? (
          <div className="mt-8 space-y-8">
            <div>
              <h2 className="text-lg font-semibold text-neutral-100">User</h2>
              <div className="mt-3 flex items-center gap-4 rounded-lg border border-neutral-800 bg-neutral-950/70 p-3">
                {user.avatar_url && !avatarFailed ? (
                  <img
                    src={user.avatar_url}
                    alt={`${user.nickname} avatar`}
                    className="h-16 w-16 rounded-full border border-neutral-700 bg-neutral-900 object-cover"
                    onError={() => setAvatarFailed(true)}
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-neutral-700 bg-neutral-900 text-xl font-semibold text-neutral-300">
                    {user.nickname.slice(0, 1).toUpperCase()}
                  </div>
                )}

                <div>
                  <p className="text-sm text-neutral-400">Avatar preview</p>
                  <p className="text-sm text-neutral-200">
                    {user.avatar_url && !avatarFailed ? "Loaded from avatar_url" : "Using fallback avatar"}
                  </p>
                </div>
              </div>

              <dl className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-lg border border-neutral-800 bg-neutral-950/70 p-3">
                  <dt className="text-neutral-400">id</dt>
                  <dd className="mt-1 break-all text-neutral-100">{user.id}</dd>
                </div>
                <div className="rounded-lg border border-neutral-800 bg-neutral-950/70 p-3">
                  <dt className="text-neutral-400">email</dt>
                  <dd className="mt-1 break-all text-neutral-100">{user.email}</dd>
                </div>
                <div className="rounded-lg border border-neutral-800 bg-neutral-950/70 p-3">
                  <dt className="text-neutral-400">nickname</dt>
                  <dd className="mt-1 text-neutral-100">{user.nickname}</dd>
                </div>
                <div className="rounded-lg border border-neutral-800 bg-neutral-950/70 p-3">
                  <dt className="text-neutral-400">avatar_url</dt>
                  <dd className="mt-1 break-all text-neutral-100">{user.avatar_url ?? "null"}</dd>
                </div>
                <div className="rounded-lg border border-neutral-800 bg-neutral-950/70 p-3">
                  <dt className="text-neutral-400">created_at</dt>
                  <dd className="mt-1 text-neutral-100">{user.created_at}</dd>
                </div>
                <div className="rounded-lg border border-neutral-800 bg-neutral-950/70 p-3">
                  <dt className="text-neutral-400">updated_at</dt>
                  <dd className="mt-1 text-neutral-100">{user.updated_at}</dd>
                </div>
              </dl>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-neutral-100">Stats</h2>
              <dl className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-lg border border-neutral-800 bg-neutral-950/70 p-3">
                  <dt className="text-neutral-400">user_id</dt>
                  <dd className="mt-1 break-all text-neutral-100">{stats?.user_id ?? "-"}</dd>
                </div>
                <div className="rounded-lg border border-neutral-800 bg-neutral-950/70 p-3">
                  <dt className="text-neutral-400">wins</dt>
                  <dd className="mt-1 text-neutral-100">{stats?.wins ?? 0}</dd>
                </div>
                <div className="rounded-lg border border-neutral-800 bg-neutral-950/70 p-3">
                  <dt className="text-neutral-400">losses</dt>
                  <dd className="mt-1 text-neutral-100">{stats?.losses ?? 0}</dd>
                </div>
                <div className="rounded-lg border border-neutral-800 bg-neutral-950/70 p-3">
                  <dt className="text-neutral-400">rating</dt>
                  <dd className="mt-1 text-neutral-100">{stats?.rating ?? 0}</dd>
                </div>
              </dl>
            </div>
          </div>
        ) : null}

        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/lobby"
            className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            Back to Lobby
          </Link>
        </div>
      </section>
    </main>
  );
}