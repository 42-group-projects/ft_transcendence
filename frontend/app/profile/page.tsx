'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
    apiGetMe,
    apiGetMyStats,
    apiUpdateProfile,
    apiUploadAvatar,
    getAvatarUrl,
    type User,
    type UserStats,
} from '@/lib/api';

export default function ProfilePage() {
    const [user, setUser] = useState<User | null>(null);
    const [stats, setStats] = useState<UserStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');

    // Edit profile state
    const [editMode, setEditMode] = useState(false);
    const [nicknameInput, setNicknameInput] = useState('');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    const loadProfile = async () => {
        try {
            setLoading(true);
            setError('');

            const [meResponse, statsResponse] = await Promise.all([
                apiGetMe(),
                apiGetMyStats(),
            ]);

            setUser(meResponse.user);
            setNicknameInput(meResponse.user?.nickname || '');
            setStats(statsResponse.stats);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Failed to load profile data',
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProfile();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarFile(file);
            const previewUrl = URL.createObjectURL(file);
            setAvatarPreview(previewUrl);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setSaving(true);
        setError('');
        setSaveMessage('');

        try {
            let updatedUser = user;

            // 1. Update nickname if changed
            if (nicknameInput !== user.nickname) {
                const res = await apiUpdateProfile(nicknameInput);
                updatedUser = res.user;
            }

            // 2. Upload avatar if selected
            if (avatarFile) {
                const res = await apiUploadAvatar(avatarFile);
                updatedUser = res.user;
            }

            setUser(updatedUser);
            setSaveMessage('Profile updated successfully!');
            setEditMode(false);
            setAvatarFile(null);
            setAvatarPreview(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setNicknameInput(user?.nickname || '');
        setAvatarFile(null);
        setAvatarPreview(null);
        setEditMode(false);
        setError('');
        setSaveMessage('');
    };

    return (
        <main className="min-h-screen bg-neutral-950 px-4 py-6 text-neutral-100 sm:px-6 lg:px-8">
            <section className="mx-auto w-full max-w-3xl rounded-2xl border border-neutral-800 bg-neutral-900/90 p-6 sm:p-8 shadow-xl backdrop-blur-md">
                <p className="text-sm uppercase tracking-[0.3em] text-neutral-500">
                    Profile
                </p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight">
                    Your Account Data
                </h1>
                <p className="mt-3 text-sm text-neutral-400">
                    Manage your identity and check your gameplay stats.
                </p>

                {loading ? (
                    <p className="mt-6 text-neutral-300">Loading profile...</p>
                ) : null}
                {error ? (
                    <p className="mt-6 text-sm text-red-400 bg-red-950/40 border border-red-800/60 rounded-lg p-3">{error}</p>
                ) : null}
                {saveMessage ? (
                    <p className="mt-6 text-sm text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 rounded-lg p-3">{saveMessage}</p>
                ) : null}

                {!loading && user ? (
                    <div className="mt-8 space-y-8">
                        <div>
                            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                                <h2 className="text-xl font-semibold text-neutral-100">
                                    Identity & Settings
                                </h2>
                                {!editMode && (
                                    <button
                                        onClick={() => setEditMode(true)}
                                        className="rounded-lg bg-neutral-800 px-4 py-1.5 text-xs font-semibold text-neutral-200 hover:bg-neutral-700 transition"
                                    >
                                        Edit Profile
                                    </button>
                                )}
                            </div>

                            {editMode ? (
                                <form onSubmit={handleSave} className="mt-6 space-y-6">
                                    {/* Avatar Upload */}
                                    <div className="flex flex-col items-center gap-4 sm:flex-row">
                                        <div className="relative group">
                                            <img
                                                src={avatarPreview || getAvatarUrl(user.avatar_url)}
                                                alt={`${user.nickname} avatar`}
                                                className="h-24 w-24 rounded-full border-2 border-emerald-500 bg-neutral-900 object-cover shadow-lg"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = getAvatarUrl(null);
                                                }}
                                            />
                                            <label
                                                htmlFor="avatar-upload"
                                                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition cursor-pointer text-xs text-white font-medium"
                                            >
                                                Change
                                            </label>
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <label className="block text-sm font-medium text-neutral-300">
                                                Profile Picture
                                            </label>
                                            <input
                                                id="avatar-upload"
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                                className="hidden"
                                            />
                                            <label
                                                htmlFor="avatar-upload"
                                                className="inline-block rounded-lg border border-neutral-700 bg-neutral-800/50 hover:bg-neutral-800 px-3 py-1.5 text-xs text-neutral-300 cursor-pointer transition"
                                            >
                                                Choose Image file
                                            </label>
                                            <p className="text-[10px] text-neutral-500">
                                                Supports PNG, JPG, JPEG, GIF, WebP, SVG. Max 5MB.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Nickname Input */}
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-medium text-neutral-300">
                                            Nickname
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            minLength={1}
                                            maxLength={20}
                                            value={nicknameInput}
                                            onChange={(e) => setNicknameInput(e.target.value)}
                                            className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3.5 py-2 text-sm text-neutral-200 outline-none focus:border-emerald-500 transition"
                                        />
                                    </div>

                                    <div className="flex items-center gap-3 pt-2">
                                        <button
                                            type="submit"
                                            disabled={saving}
                                            className="rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 px-5 py-2 text-xs font-semibold text-white transition shadow-lg shadow-emerald-950/20"
                                        >
                                            {saving ? 'Saving...' : 'Save Changes'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleCancel}
                                            className="rounded-lg bg-neutral-800 hover:bg-neutral-700 px-5 py-2 text-xs font-semibold text-neutral-300 transition"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="mt-6 space-y-6">
                                    <div className="flex flex-col items-center gap-4 sm:flex-row rounded-xl border border-neutral-800/80 bg-neutral-950/40 p-4">
                                        <img
                                            src={getAvatarUrl(user.avatar_url)}
                                            alt={`${user.nickname} avatar`}
                                            className="h-24 w-24 rounded-full border-2 border-neutral-800 bg-neutral-900 object-cover shadow-md"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = getAvatarUrl(null);
                                            }}
                                        />
                                        <div>
                                            <h3 className="text-lg font-medium text-neutral-200">{user.nickname}</h3>
                                            <p className="text-xs text-neutral-500">{user.email}</p>
                                            <p className="mt-1.5 text-[11px] text-neutral-400 bg-neutral-900/60 border border-neutral-800 px-2 py-0.5 rounded inline-block">
                                                {user.avatar_url && user.avatar_url !== '/api/uploads/default-avatar.svg' ? 'Custom avatar set' : 'Using default avatar'}
                                            </p>
                                        </div>
                                    </div>

                                    <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                                        <div className="rounded-lg border border-neutral-800/60 bg-neutral-950/30 p-3">
                                            <dt className="text-neutral-500 text-xs uppercase tracking-wider">User ID</dt>
                                            <dd className="mt-1 break-all text-neutral-100 font-mono text-xs">
                                                {user.id}
                                            </dd>
                                        </div>
                                        <div className="rounded-lg border border-neutral-800/60 bg-neutral-950/30 p-3">
                                            <dt className="text-neutral-500 text-xs uppercase tracking-wider">Email Address</dt>
                                            <dd className="mt-1 break-all text-neutral-100">
                                                {user.email}
                                            </dd>
                                        </div>
                                        <div className="rounded-lg border border-neutral-800/60 bg-neutral-950/30 p-3">
                                            <dt className="text-neutral-500 text-xs uppercase tracking-wider">Nickname</dt>
                                            <dd className="mt-1 text-neutral-100">
                                                {user.nickname}
                                            </dd>
                                        </div>
                                        <div className="rounded-lg border border-neutral-800/60 bg-neutral-950/30 p-3">
                                            <dt className="text-neutral-500 text-xs uppercase tracking-wider">Avatar Path</dt>
                                            <dd className="mt-1 break-all text-neutral-100 font-mono text-xs">
                                                {user.avatar_url ?? 'null'}
                                            </dd>
                                        </div>
                                        <div className="rounded-lg border border-neutral-800/60 bg-neutral-950/30 p-3">
                                            <dt className="text-neutral-500 text-xs uppercase tracking-wider">Created At</dt>
                                            <dd className="mt-1 text-neutral-100">
                                                {new Date(user.created_at).toLocaleString()}
                                            </dd>
                                        </div>
                                        <div className="rounded-lg border border-neutral-800/60 bg-neutral-950/30 p-3">
                                            <dt className="text-neutral-500 text-xs uppercase tracking-wider">Last Updated</dt>
                                            <dd className="mt-1 text-neutral-100">
                                                {new Date(user.updated_at).toLocaleString()}
                                            </dd>
                                        </div>
                                    </dl>
                                </div>
                            )}
                        </div>

                        <div>
                            <h2 className="border-b border-neutral-800 pb-3 text-xl font-semibold text-neutral-100">
                                Gameplay Stats
                            </h2>
                            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                                <div className="rounded-lg border border-neutral-800/60 bg-neutral-950/30 p-3 text-center">
                                    <dt className="text-neutral-500 text-xs uppercase tracking-wider">Wins</dt>
                                    <dd className="mt-1 text-2xl font-bold text-emerald-400">
                                        {stats?.wins ?? 0}
                                    </dd>
                                </div>
                                <div className="rounded-lg border border-neutral-800/60 bg-neutral-950/30 p-3 text-center">
                                    <dt className="text-neutral-500 text-xs uppercase tracking-wider">Losses</dt>
                                    <dd className="mt-1 text-2xl font-bold text-rose-400">
                                        {stats?.losses ?? 0}
                                    </dd>
                                </div>
                                <div className="rounded-lg border border-neutral-800/60 bg-neutral-950/30 p-3 text-center">
                                    <dt className="text-neutral-500 text-xs uppercase tracking-wider">Win Rate</dt>
                                    <dd className="mt-1 text-2xl font-bold text-neutral-100">
                                        {stats ? (stats.wins + stats.losses > 0 ? `${Math.round((stats.wins / (stats.wins + stats.losses)) * 100)}%` : '0%') : '0%'}
                                    </dd>
                                </div>
                                <div className="rounded-lg border border-neutral-800/60 bg-neutral-950/30 p-3 text-center">
                                    <dt className="text-neutral-500 text-xs uppercase tracking-wider">Rating</dt>
                                    <dd className="mt-1 text-2xl font-bold text-blue-400">
                                        {stats?.rating ?? 1000}
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                ) : null}

                <div className="mt-8 flex items-center justify-center gap-3 border-t border-neutral-800 pt-6">
                    <Link
                        href="/lobby"
                        className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 shadow-lg shadow-blue-950/20"
                    >
                        Back to Lobby
                    </Link>
                </div>
            </section>
        </main>
    );
}
