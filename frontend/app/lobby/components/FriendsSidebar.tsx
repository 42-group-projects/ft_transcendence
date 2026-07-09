'use client';

import { useEffect, useMemo, useState } from 'react';
import {
    apiGetFriends,
    apiGetFriendRequests,
    apiSendFriendRequest,
    apiAcceptFriendRequest,
    apiRejectFriendRequest,
    apiRemoveFriend,
    apiGetMe,
    apiSearchUsers,
    getAvatarUrl,
} from '@/lib/api';
import { usePresence } from '../hooks/usePresence';

export function FriendsSidebar() {
    const [mobileOpen, setMobileOpen] = useState(false);

    // データステート
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [friends, setFriends] = useState<any[]>([]);
    const [requests, setRequests] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [message, setMessage] = useState('');

    // リアルタイムプレゼンス
    const friendIds = useMemo(() => friends.map((f) => f.userId), [friends]);
    const onlineStatuses = usePresence(currentUserId || '', friendIds);

    // 初期化：自分の情報を取得し、その後フレンド情報を取得
    const fetchData = async () => {
        try {
            const { user } = await apiGetMe();
            const myId = user?.id;

            if (!myId) return;
            setCurrentUserId(myId);

            const [friendsData, requestsData] = await Promise.all([
                apiGetFriends(),
                apiGetFriendRequests(),
            ]);
            setFriends(friendsData);
            setRequests(requestsData);
        } catch (error) {
            console.error('Failed to fetch friend data:', error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // リアルタイムニックネーム検索デバウンス
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }
        const delayDebounce = setTimeout(async () => {
            try {
                const res = await apiSearchUsers(searchQuery);
                setSearchResults(res.users || []);
            } catch (err) {
                console.error('Search failed:', err);
            }
        }, 300);
        return () => clearTimeout(delayDebounce);
    }, [searchQuery]);

    const onlineCount = useMemo(() => {
        return friends.filter(
            (f) => (onlineStatuses[f.userId] || f.onlineStatus) === 'online',
        ).length;
    }, [friends, onlineStatuses]);

    // アクションハンドラ
    const handleSendRequest = async (receiverId: string) => {
        if (!currentUserId || !receiverId) return;
        try {
            await apiSendFriendRequest(receiverId);
            setMessage('フレンド申請を送信しました');
            setSearchQuery('');
            setSearchResults([]);
        } catch (error: any) {
            setMessage(error.message || 'エラーが発生しました');
        }
        setTimeout(() => setMessage(''), 3000);
    };

    const handleAccept = async (reqId: string) => {
        if (!currentUserId) return;
        try {
            await apiAcceptFriendRequest(reqId);
            fetchData(); // 成功したらリストを更新
        } catch (error: any) {
            setMessage(error.message || '承認に失敗しました');
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const handleReject = async (reqId: string) => {
        if (!currentUserId) return;
        try {
            await apiRejectFriendRequest(reqId);
            fetchData();
        } catch (error: any) {
            setMessage(error.message || '拒否に失敗しました');
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const handleRemove = async (friendId: string) => {
        if (!currentUserId) return;
        if (confirm('本当にフレンドを解除しますか？')) {
            try {
                await apiRemoveFriend(friendId);
                fetchData();
            } catch (error: any) {
                setMessage(error.message || 'フレンドの解除に失敗しました');
                setTimeout(() => setMessage(''), 3000);
            }
        }
    };

    // --- 内部UIコンテンツ ---
    const renderSidebarContent = () => (
        <div className="flex h-full flex-col">
            <div className="mb-3 mt-3 px-3">
                <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">
                    Friends
                </p>
                <p className="mt-1 text-xs text-neutral-400">
                    {onlineCount} online • {friends.length} total
                </p>
            </div>

            <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-5">
                {/* フレンド検索・追加フォーム */}
                <div className="relative space-y-2">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search nickname to add..."
                        className="w-full rounded-lg border border-neutral-700 bg-neutral-900/80 px-3 py-1.5 text-xs text-neutral-200 outline-none focus:border-emerald-500 transition"
                    />
                    {searchResults.length > 0 && (
                        <ul className="absolute left-0 right-0 z-40 mt-1 max-h-48 overflow-y-auto rounded-lg border border-neutral-700 bg-neutral-950 p-1 shadow-xl">
                            {searchResults.map((user) => (
                                <li
                                    key={user.id}
                                    className="flex items-center justify-between rounded-md p-1.5 hover:bg-neutral-900 transition"
                                >
                                    <div className="flex items-center gap-2 truncate pr-2">
                                        <img
                                            src={getAvatarUrl(user.avatar_url)}
                                            alt={user.nickname}
                                            className="h-6 w-6 rounded-full border border-neutral-800 object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = '/api/uploads/default-avatar.svg';
                                            }}
                                        />
                                        <span className="text-xs text-neutral-200 truncate">{user.nickname}</span>
                                    </div>
                                    <button
                                        onClick={() => handleSendRequest(user.id)}
                                        className="rounded bg-emerald-600/80 hover:bg-emerald-500 px-2 py-1 text-[10px] font-semibold text-white transition"
                                    >
                                        Add
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                    {message && (
                        <p className="text-[10px] text-amber-400">{message}</p>
                    )}
                </div>

                {/* 承認待ちリクエスト */}
                {requests.length > 0 && (
                    <div>
                        <p className="mb-2 text-[10px] uppercase tracking-wider text-amber-500">
                            Pending Requests
                        </p>
                        <ul className="space-y-2">
                            {requests.map((req) => (
                                <li
                                    key={req.id}
                                    className="rounded-lg border border-neutral-800 bg-neutral-900/80 p-2"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <img
                                            src={getAvatarUrl(req.senderAvatar)}
                                            alt={req.senderNickname || 'User'}
                                            className="h-6 w-6 rounded-full border border-neutral-700 object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = '/api/uploads/default-avatar.svg';
                                            }}
                                        />
                                        <span className="text-xs font-medium text-neutral-200 truncate">
                                            {req.senderNickname || req.senderId.substring(0, 8)}
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleAccept(req.id)}
                                            className="flex-1 rounded bg-emerald-500/20 text-emerald-400 py-1 text-[10px] hover:bg-emerald-500/40 transition"
                                        >
                                            Accept
                                        </button>
                                        <button
                                            onClick={() => handleReject(req.id)}
                                            className="flex-1 rounded bg-rose-500/20 text-rose-400 py-1 text-[10px] hover:bg-rose-500/40 transition"
                                        >
                                            Decline
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* フレンドリスト */}
                <div>
                    <p className="mb-2 text-[10px] uppercase tracking-wider text-neutral-500">
                        My Friends
                    </p>
                    <ul className="space-y-2">
                        {friends.length === 0 && (
                            <p className="text-xs text-neutral-600">
                                No friends yet.
                            </p>
                        )}
                        {friends.map((friend) => {
                            const status =
                                onlineStatuses[friend.userId] ||
                                friend.onlineStatus ||
                                'offline';
                            let statusColor = 'bg-neutral-600';
                            if (status === 'online')
                                statusColor = 'bg-emerald-400';
                            if (status === 'in_game')
                                statusColor = 'bg-blue-400';

                            const avatarUrl = getAvatarUrl(friend.avatarUrl || friend.avatar_url);

                            return (
                                <li
                                    key={friend.userId}
                                    className="group flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900/80 px-3 py-2 transition hover:border-neutral-700"
                                >
                                    <div className="flex items-center gap-2 truncate pr-2">
                                        <img
                                            src={avatarUrl}
                                            alt={friend.nickname || 'Friend'}
                                            className="h-8 w-8 rounded-full border border-neutral-700 object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = '/api/uploads/default-avatar.svg';
                                            }}
                                        />
                                        <div className="flex flex-col truncate">
                                            <span
                                                className="text-sm font-medium text-neutral-100 truncate"
                                                title={friend.nickname || friend.userId}
                                            >
                                                {friend.nickname || friend.userId.substring(0, 8)}
                                            </span>
                                            <span className="flex items-center gap-1.5 text-[10px] text-neutral-400 uppercase tracking-wider">
                                                <span
                                                    className={`h-1.5 w-1.5 rounded-full ${statusColor}`}
                                                />
                                                {status.replace('_', ' ')}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() =>
                                            handleRemove(friend.userId)
                                        }
                                        className="opacity-0 group-hover:opacity-100 text-[10px] text-rose-500 hover:text-rose-400 transition"
                                    >
                                        Remove
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* --- Mobile Dropdown --- */}
            <div className="pointer-events-none absolute right-4 top-4 z-30 md:hidden">
                <div className="pointer-events-auto">
                    <button
                        type="button"
                        onClick={() => setMobileOpen((value) => !value)}
                        className="rounded-lg border border-neutral-700 bg-neutral-900/90 px-3 py-2 text-xs font-semibold text-neutral-200 backdrop-blur-md transition hover:bg-neutral-800"
                    >
                        Friends ({onlineCount})
                    </button>

                    {mobileOpen && (
                        <div className="mt-2 w-[min(88vw,20rem)] max-h-[80vh] flex flex-col overflow-hidden rounded-2xl border border-neutral-700/80 bg-neutral-950/95 shadow-2xl shadow-black/40 backdrop-blur-md">
                            {renderSidebarContent()}
                        </div>
                    )}
                </div>
            </div>

            {/* --- Desktop Drawer --- */}
            <div className="pointer-events-none absolute inset-y-0 right-0 z-20 hidden items-start md:flex">
                <div className="pointer-events-auto flex h-full w-[min(80vw,18rem)] flex-col overflow-hidden rounded-l-2xl border-l border-neutral-700/80 bg-neutral-950/90 shadow-2xl shadow-black/40 backdrop-blur-md sm:w-72">
                    {renderSidebarContent()}
                </div>
            </div>
        </>
    );
}
