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
} from '@/lib/api';
import { usePresence } from '../hooks/usePresence';
import { useDmChat, type DmMessage } from '../hooks/useDmChat';

// ── Floating chat window ──────────────────────────────────────────────────

function FloatingChatWindow({
    userId,
    thread,
    isOfflineWarning,
    onClose,
    onSend,
}: {
    userId: string;
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
        <div className="flex w-full flex-col overflow-hidden rounded-t-xl border border-neutral-700/80 bg-neutral-950 shadow-2xl shadow-black/50 backdrop-blur-md">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-700/80 bg-neutral-900/90 px-3 py-2">
                <span
                    className="truncate text-xs font-semibold text-neutral-200"
                    title={userId}
                >
                    {userId.substring(0, 10)}…
                </span>
                <button
                    type="button"
                    onClick={onClose}
                    className="ml-2 shrink-0 rounded p-0.5 text-neutral-500 transition hover:bg-neutral-700 hover:text-neutral-200"
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
                    <p className="text-[10px] text-rose-400">
                        User is offline — message not delivered.
                    </p>
                )}
                {thread.length === 0 && (
                    <p className="py-4 text-center text-[10px] text-neutral-600">
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
                                    ? 'bg-sky-600/30 text-sky-100'
                                    : 'bg-neutral-700 text-neutral-200'
                            }`}
                        >
                            {msg.text}
                        </span>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="flex gap-1 border-t border-neutral-800 px-2 py-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSend();
                    }}
                    maxLength={500}
                    placeholder="Message…"
                    className="min-w-0 flex-1 rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-[11px] text-neutral-200 outline-none transition focus:border-sky-500"
                />
                <button
                    type="button"
                    onClick={handleSend}
                    className="rounded bg-sky-600/70 px-2 py-1 text-[10px] font-semibold text-white transition hover:bg-sky-500"
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
    const [targetId, setTargetId] = useState('');
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
        for (const [userId, msgs] of Object.entries(threads)) {
            const inboundLen = msgs.filter((m) => m.direction === 'in').length;
            const prev = prevInboundLengths.current[userId] ?? 0;
            if (inboundLen > prev && !openChatIds.includes(userId)) {
                setUnreadCounts((c) => ({
                    ...c,
                    [userId]: (c[userId] ?? 0) + (inboundLen - prev),
                }));
            }
            prevInboundLengths.current[userId] = inboundLen;
        }
    }, [threads, openChatIds]);

    const fetchData = async () => {
        try {
            // モックサーバーから「自分のダミー情報」を受け取る
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

    const handleSendRequest = async () => {
        if (!currentUserId || !targetId) return;
        try {
            await apiSendFriendRequest(targetId);
            setMessage('申請を送信しました');
            setTargetId('');
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
            setTimeout(() => setMessage(''), 3000); // 3秒後にメッセージを消す
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
        <div className="flex h-full flex-col">
            <div className="mb-3 mt-3 px-3">
                <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">
                    Friends
                </p>
                <p className="mt-1 text-xs text-neutral-400">
                    {onlineCount} online • {friends.length} total
                </p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3 space-y-5">
                {/* Add friend */}
                <div className="space-y-2">
                    <input
                        type="text"
                        value={targetId}
                        onChange={(e) => setTargetId(e.target.value)}
                        placeholder="Add friend by ID..."
                        className="w-full rounded-lg border border-neutral-700 bg-neutral-900/80 px-3 py-1.5 text-xs text-neutral-200 outline-none focus:border-emerald-500 transition"
                    />
                    <button
                        onClick={handleSendRequest}
                        className="w-full rounded-lg bg-emerald-600/80 hover:bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition"
                    >
                        Send Request
                    </button>
                    {message && (
                        <p className="text-[10px] text-amber-400">{message}</p>
                    )}
                </div>

                {/* Pending requests */}
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
                                    <span className="block text-xs text-neutral-200 mb-2 truncate">
                                        {req.senderNickname || req.senderId}
                                    </span>
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

                {/* Friends list */}
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

                            const unread = unreadCounts[friend.userId] ?? 0;
                            const isOpen = openChatIds.includes(friend.userId);

                            return (
                                <li
                                    key={friend.userId}
                                    className="group rounded-lg border border-neutral-800 bg-neutral-900/80 transition hover:border-neutral-700"
                                >
                                    <div className="flex items-center justify-between px-3 py-2">
                                        <div className="flex flex-col truncate pr-2">
                                            <span
                                                className="text-sm text-neutral-100 truncate"
                                                title={friend.userId}
                                            >
                                                {friend.userId.substring(0, 8)}…
                                            </span>
                                            <span className="flex items-center gap-1.5 text-[10px] text-neutral-400 uppercase tracking-wider">
                                                <span
                                                    className={`h-1.5 w-1.5 rounded-full ${statusColor}`}
                                                />
                                                {status.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            {/* Challenge button */}
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleChallenge(
                                                        friend.userId,
                                                    )
                                                }
                                                disabled={status === 'offline'}
                                                className="rounded px-2 py-1 text-[10px] font-medium transition disabled:text-neutral-600 text-orange-400 hover:bg-orange-500/20 hover:text-orange-300 disabled:hover:bg-transparent"
                                            >
                                                Challenge
                                            </button>
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
                                                className="rounded px-2 py-1 text-[10px] font-medium transition disabled:text-neutral-600 text-sky-300 hover:bg-orange-500/20 hover:bg-sky-900 disabled:hover:bg-transparent"
                                            >
                                                Chat
                                                {unread > 0 && !isOpen && (
                                                    <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-orange-500 text-[8px] font-bold text-white">
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
                                                className="rounded px-2 py-1 text-[10px] font-medium text-rose-400 transition hover:bg-rose-500/20 hover:text-rose-300"
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

            {/* --- Floating chat windows (Facebook-style) --- */}
            {openChatIds.length > 0 && (
                <div className="pointer-events-none fixed bottom-0 right-0 z-50 flex max-w-full flex-row-reverse items-end gap-1 overflow-hidden">
                    {openChatIds.map((userId) => (
                        <div
                            key={userId}
                            className="pointer-events-auto min-w-20 max-w-64 flex-1"
                        >
                            <FloatingChatWindow
                                userId={userId}
                                thread={threads[userId] ?? []}
                                isOfflineWarning={offlineUserId === userId}
                                onClose={() => closeChat(userId)}
                                onSend={(text) => sendDm(userId, text)}
                            />
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}
