'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { useDmChat, type DmMessage } from '../hooks/useDmChat';
import { usePresenceSocket } from '@/app/components/PresenceProvider';

// ── Floating chat window ──────────────────────────────────────────────────

function FloatingChatWindow({
    userId,
    displayName,
    thread,
    isOfflineWarning,
    onClose,
    onSend,
}: {
    userId: string;
    displayName: string;
    thread: DmMessage[];
    isOfflineWarning: boolean;
    onClose: () => void;
    onSend: (text: string) => void;
}) {
    const [input, setInput] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [thread]);

    const handleSend = () => {
        if (!input.trim()) return;
        onSend(input);
        setInput('');
    };

    return (
        <div className="flex w-full flex-col overflow-hidden border-2 border-neutral-600 bg-yellow-100 shadow-lg shadow-red-900/10 backdrop-blur-sm">
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-neutral-600 bg-neutral-800 px-3 py-2 bg-red-700">
                <span
                    className="truncate text-xs font-semibold text-"
                    title={displayName}
                >
                    {displayName}
                </span>
                <button
                    type="button"
                    onClick={onClose}
                    className="ml-2 shrink-0 rounded p-0.5 text-neutral-600 transition hover:bg-red-400 bg-red-100 hover:text-neutral-800"
                    aria-label="Close chat"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            </div>

            {/* Messages */}
            <div className="flex h-48 flex-col gap-1 overflow-y-auto p-2">
                {isOfflineWarning && (
                    <p className="text-[10px] text-red-700">
                        User is offline — message not delivered.
                    </p>
                )}
                {thread.length === 0 && (
                    <p className="py-4 text-center text-[10px] text-stone-600">
                        No messages yet.
                    </p>
                )}
                {thread.map((msg, i) => (
                    <div
                        key={i}
                        className={`flex ${msg.direction === 'out' ? 'justify-end' : 'justify-start'}`}
                    >
                        <span
                            className={`max-w-[80%] break-words rounded px-2 py-1 text-[11px] ${
                                msg.direction === 'out'
                                    ? 'bg-red-800/30 text-red-900'
                                    : 'bg-neutral-600 text-'
                            }`}
                        >
                            {msg.text}
                        </span>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="flex gap-1 border-t-2 border-neutral-600 px-2 py-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSend();
                    }}
                    maxLength={500}
                    placeholder="Message…"
                    className="min-w-0 flex-1 rounded border-2 border-neutral-600 bg-yellow-100 px-2 py-1 text-[11px] text-stone-900 outline-none transition focus:border-stone-700"
                />
                <button
                    type="button"
                    onClick={handleSend}
                    className="rounded bg-green-400 px-2 py-1 text-[10px] font-semibold text- transition hover:bg-green-800"
                >
                    Send
                </button>
            </div>
        </div>
    );
}

// ── Sidebar ───────────────────────────────────────────────────────────────

export function FriendsSidebar() {
    const router = useRouter();
    const [mobileOpen, setMobileOpen] = useState(false);

    // Data state
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [friends, setFriends] = useState<any[]>([]);
    const [requests, setRequests] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [message, setMessage] = useState('');

    // Open floating chat windows (ordered: first opened = leftmost)
    const [openChatIds, setOpenChatIds] = useState<string[]>([]);

    // Real-time presence
    const friendIds = useMemo(() => friends.map((f) => f.userId), [friends]);
    const onlineStatuses = usePresence(currentUserId || '', friendIds);

    // DM chat
    const { threads, offlineUserId, sendDm } = useDmChat();

    // Unread badge — count inbound messages for windows that are not open
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>(
        {},
    );
    const prevInboundLengths = useRef<Record<string, number>>({});
    useEffect(() => {
        const deltas: Record<string, number> = {};

        for (const [userId, msgs] of Object.entries(threads)) {
            const inboundLen = msgs.filter((m) => m.direction === 'in').length;
            const prev = prevInboundLengths.current[userId] ?? 0;
            if (inboundLen > prev && !openChatIds.includes(userId)) {
                deltas[userId] = inboundLen - prev;
            }
            prevInboundLengths.current[userId] = inboundLen;
        }

        if (Object.keys(deltas).length > 0) {
            setUnreadCounts((current) => {
                const next = { ...current };
                for (const [userId, delta] of Object.entries(deltas)) {
                    next[userId] = (next[userId] ?? 0) + delta;
                }
                return next;
            });
        }
    }, [threads, openChatIds]);

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

        let cancelled = false;
        const delayDebounce = setTimeout(async () => {
            try {
                const res = await apiSearchUsers(searchQuery);
                if (!cancelled) {
                    setSearchResults(res.users || []);
                }
            } catch (err) {
                if (!cancelled) {
                    console.error('Search failed:', err);
                }
            }
        }, 300);

        return () => {
            cancelled = true;
            clearTimeout(delayDebounce);
        };
    }, [searchQuery]);

    const onlineCount = useMemo(() => {
        return friends.filter(
            (f) => (onlineStatuses[f.userId] || f.onlineStatus) === 'online',
        ).length;
    }, [friends, onlineStatuses]);

    const openChat = (userId: string) => {
        setOpenChatIds((prev) =>
            prev.includes(userId) ? prev : [...prev, userId],
        );
        setUnreadCounts((c) => ({ ...c, [userId]: 0 }));
    };

    const closeChat = (userId: string) => {
        setOpenChatIds((prev) => prev.filter((id) => id !== userId));
    };

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

    const socket = usePresenceSocket();
    const [activeSessionOpponentId, setActiveSessionOpponentId] = useState<
        string | null
    >(null);
    const [sessionExpiredMsg, setSessionExpiredMsg] = useState(false);

    const handleRejoin = () => {
        socket?.emit(
            'checkActiveSession',
            ({ active }: { active: boolean; opponentId: string | null }) => {
                if (active) {
                    router.push('/game/multiplayer');
                } else {
                    setActiveSessionOpponentId(null);
                    setSessionExpiredMsg(true);
                    setTimeout(() => setSessionExpiredMsg(false), 4000);
                }
            },
        );
    };

    useEffect(() => {
        if (!socket) return;
        // Listen for future notifications (e.g. after a socket reconnect)
        const onActiveSession = ({
            opponentId,
        }: {
            opponentId: string | null;
        }) => setActiveSessionOpponentId(opponentId ?? 'unknown');
        socket.on('hasActiveSession', onActiveSession);
        // Query current state immediately — the connection event may have
        // already fired before this component mounted.
        socket.emit(
            'checkActiveSession',
            ({
                active,
                opponentId,
            }: {
                active: boolean;
                opponentId: string | null;
            }) => {
                if (active) setActiveSessionOpponentId(opponentId ?? 'unknown');
            },
        );
        return () => {
            socket.off('hasActiveSession', onActiveSession);
        };
    }, [socket]);

    const handleChallenge = (friendId: string) => {
        const pw = Math.random().toString(36).slice(2, 10);
        router.push(
            `/game/multiplayer?challenge=${encodeURIComponent(friendId)}&pw=${pw}`,
        );
    };

    const handleRemove = async (friendId: string) => {
        if (!currentUserId) return;
        if (confirm('Remove this friend?')) {
            try {
                await apiRemoveFriend(friendId);
                closeChat(friendId);
                fetchData();
            } catch (error: any) {
                setMessage(error.message || 'Failed to remove friend');
                setTimeout(() => setMessage(''), 3000);
            }
        }
    };

    const renderSidebarContent = () => (
        <div className="flex h-full flex-col border-3 border-stone-500">
            <div className="mb-3 mt-3 px-3">
                <p className="text-xs uppercase tracking-[0.25em] text-stone-700">
                    Friends
                </p>
                <p className="mt-1 text-xs text-stone-600">
                    {onlineCount} online • {friends.length} total
                </p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto pb-3 space-y-5">
                {/* フレンド検索・追加フォーム */}
                <div className="relative space-y-2 px-3 ">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search nickname to add..."
                        className="w-full border-2 border-neutral-600 bg-yellow-50 px-3 py-1.5 text-xs text-stone-900 outline-none focus:border-stone-700 transition"
                    />
                    {searchResults.length > 0 && (
                        <ul className="absolute left-0 right-0 z-40 mt-1 max-h-48 overflow-y-auto border-2 border-neutral-600 bg-yellow-100 p-1 shadow-lg">
                            {searchResults.map((user) => (
                                <li
                                    key={user.id}
                                    className="flex items-center justify-between p-1.5 hover:bg-stone-100 transition"
                                >
                                    <div className="flex items-center gap-2 truncate pr-2">
                                        <img
                                            src={getAvatarUrl(user.avatar_url)}
                                            alt={user.nickname}
                                            className="h-6 w-6 border-2 border-neutral-600 object-cover"
                                            onError={(e) => {
                                                (
                                                    e.target as HTMLImageElement
                                                ).src = getAvatarUrl(null);
                                            }}
                                        />
                                        <span className="text-xs text-stone-900 truncate">
                                            {user.nickname}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() =>
                                            handleSendRequest(user.nickname)
                                        }
                                        className="rounded bg-green-700 hover:bg-green-600 px-2 py-1 text-[10px] font-semibold text- transition"
                                    >
                                        Add
                                    </button>
                                </li>
                            ))}
                            {message && (
                                <li className="border-t-2 border-neutral-600 p-1.5 text-center">
                                    <span className="text-[10px] text-amber-700 font-medium">
                                        {message}
                                    </span>
                                </li>
                            )}
                        </ul>
                    )}
                    {searchResults.length === 0 && message && (
                        <p className="text-[10px] text-amber-700">{message}</p>
                    )}
                    {sessionExpiredMsg && (
                        <p className="text-[10px] text-red-700">
                            Match has concluded — session expired.
                        </p>
                    )}
                </div>

                {/* Pending requests */}
                {requests.length > 0 && (
                    <div>
                        <p className="mb-2 text-[10px] uppercase tracking-wider text-amber-700">
                            Pending Requests
                        </p>
                        <ul className="space-y-2">
                            {requests.map((req) => (
                                <li
                                    key={req.id}
                                    className="border-2 border-neutral-600 bg-yellow-100 p-2"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <img
                                            src={getAvatarUrl(req.senderAvatar)}
                                            alt={req.senderNickname || 'User'}
                                            className="h-6 w-6 border-2 border-neutral-600 object-cover"
                                            onError={(e) => {
                                                (
                                                    e.target as HTMLImageElement
                                                ).src = getAvatarUrl(null);
                                            }}
                                        />
                                        <span className="text-xs font-medium text-stone-900 truncate">
                                            {req.senderNickname ||
                                                req.senderId.substring(0, 8)}
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleAccept(req.id)}
                                            className="flex-1 rounded bg-green-700/20 text-green-800 py-1 text-[10px] hover:bg-green-700/40 transition"
                                        >
                                            Accept
                                        </button>
                                        <button
                                            onClick={() => handleReject(req.id)}
                                            className="flex-1 rounded bg-red-700/20 text-red-800 py-1 text-[10px] hover:bg-red-700/40 transition"
                                        >
                                            Decline
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Friends list */}
                <div>
                    <p className="mb-2 uppercase tracking-wider text-stone-700 px-2">
                        My Friends
                    </p>
                    <ul className="">
                        {friends.length === 0 && (
                            <p className="text-xs text-stone-600">
                                No friends yet.
                            </p>
                        )}
                        {friends.map((friend) => {
                            const status =
                                onlineStatuses[friend.userId] ||
                                friend.onlineStatus ||
                                'offline';
                            let statusColor = 'bg-stone-200';
                            if (status === 'online')
                                statusColor = 'bg-green-400';
                            if (status === 'in_game')
                                statusColor = 'bg-amber-200';

                            const avatarUrl = getAvatarUrl(
                                friend.avatarUrl || friend.avatar_url,
                            );
                            const unread = unreadCounts[friend.userId] ?? 0;
                            const isOpen = openChatIds.includes(friend.userId);

                            return (
                                <li
                                    key={friend.userId}
                                    className="group border-1 border-neutral-600 bg-yellow-100/50 transition"
                                >
                                    <div className="flex items-center justify-between px-1 py-3">
                                        <div className="flex items-center gap-2 truncate">
                                            <img
                                                src={avatarUrl}
                                                alt={
                                                    friend.nickname || 'Friend'
                                                }
                                                className="h-8 w-8 border-2 border-neutral-600 object-cover"
                                                onError={(e) => {
                                                    (
                                                        e.target as HTMLImageElement
                                                    ).src = getAvatarUrl(null);
                                                }}
                                            />
                                            <div className="flex flex-col truncate">
                                                <span
                                                    className="text-sm text-stone-900 truncate"
                                                    title={
                                                        friend.nickname ||
                                                        friend.userId
                                                    }
                                                >
                                                    {friend.nickname ||
                                                        friend.userId.substring(
                                                            0,
                                                            8,
                                                        )}
                                                </span>
                                                <span className="flex items-center gap-1.5 text-[10px] text-stone-600 uppercase tracking-wider">
                                                    <span
                                                        className={`h-1.5 w-1.5 ${statusColor} rounded`}
                                                    />
                                                    {status.replace('_', ' ')}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            {/* Challenge / Rejoin button */}
                                            {activeSessionOpponentId ===
                                            friend.userId ? (
                                                <button
                                                    type="button"
                                                    onClick={handleRejoin}
                                                    className="rounded px-2 py-1 text-[10px] font-medium transition text-amber-800 hover:bg-amber-600/20 hover:text-amber-900"
                                                >
                                                    Rejoin
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleChallenge(
                                                            friend.userId,
                                                        )
                                                    }
                                                    disabled={
                                                        status === 'offline' ||
                                                        status === 'in_game' ||
                                                        activeSessionOpponentId !==
                                                            null
                                                    }
                                                    className="rounded px-2 py-1 text-[10px] font-medium transition disabled:text-neutral-600 text-red-900 hover:bg-orange-500/20 hover:text-grey-300 disabled:hover:bg-transparent"
                                                >
                                                    Challenge
                                                </button>
                                            )}
                                            {/* Chat button */}
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    isOpen
                                                        ? closeChat(
                                                              friend.userId,
                                                          )
                                                        : openChat(
                                                              friend.userId,
                                                          )
                                                }
                                                disabled={status === 'offline'}
                                                className="relative rounded px-2 py-1 text-[10px] font-medium transition disabled:text-neutral-600 text-grey-300 hover:bg-orange-500/20 hover:bg-orange-200/20 disabled:hover:bg-transparent"
                                            >
                                                Chat
                                                {unread > 0 && !isOpen && (
                                                    <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center bg-green-300 text-[8px] font-bold text-">
                                                        {unread > 9
                                                            ? '9+'
                                                            : unread}
                                                    </span>
                                                )}
                                            </button>
                                            {/* Remove button */}
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleRemove(friend.userId)
                                                }
                                                className="rounded px-2 py-1 text-[10px] font-medium text-red-700 transition hover:bg-red-700/20 hover:text-red-800"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
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
                        className="border-2 border-neutral-600 bg-red-800 px-3 py-2 text-xs font-semibold text- backdrop-blur-md transition hover:bg-red-900"
                    >
                        Friends ({onlineCount})
                    </button>

                    {mobileOpen && (
                        <div className="mt-2 w-[min(88vw,20rem)] max-h-[80vh] flex flex-col overflow-hidden border-2 border-neutral-600 bg-yellow-100 shadow-lg shadow-red-900/10 backdrop-blur-md">
                            {renderSidebarContent()}
                        </div>
                    )}
                </div>
            </div>

            {/* --- Desktop Drawer --- */}
            <div className="pointer-events-none absolute inset-y-0 right-0 z-20 hidden items-start md:flex">
                <div className="pointer-events-auto flex h-full w-[min(80vw,18rem)] flex-col overflow-hidden border-l-2 border-neutral-600 bg-yellow-100 shadow-lg shadow-red-900/10 backdrop-blur-md sm:w-72">
                    {renderSidebarContent()}
                </div>
            </div>

            {/* --- Floating chat windows (Facebook-style) --- */}
            {openChatIds.length > 0 && (
                <div className="pointer-events-none fixed bottom-0 right-0 z-50 flex max-w-full flex-row-reverse items-end gap-1 overflow-hidden">
                    {openChatIds.map((userId) => {
                        const friend = friends.find((f) => f.userId === userId);
                        const name =
                            friend?.nickname || userId.substring(0, 8) + '…';
                        return (
                            <div
                                key={userId}
                                className="pointer-events-auto min-w-20 max-w-64 flex-1"
                            >
                                <FloatingChatWindow
                                    userId={userId}
                                    displayName={name}
                                    thread={threads[userId] ?? []}
                                    isOfflineWarning={offlineUserId === userId}
                                    onClose={() => closeChat(userId)}
                                    onSend={(text) => sendDm(userId, text)}
                                />
                            </div>
                        );
                    })}
                </div>
            )}
        </>
    );
}
