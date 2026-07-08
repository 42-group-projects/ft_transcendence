'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePresenceSocket } from '@/app/components/PresenceProvider';

export type DmMessage = {
    fromUserId: string; // 'me' for outgoing
    text: string;
    timestamp: number;
    direction: 'in' | 'out';
};

// threads: messages keyed by the other user's ID
export type DmThreads = Record<string, DmMessage[]>;

export function useDmChat() {
    const socket = usePresenceSocket();
    const [threads, setThreads] = useState<DmThreads>({});
    // userId that most recently failed (offline), cleared after 3 s
    const [offlineUserId, setOfflineUserId] = useState<string | null>(null);

    useEffect(() => {
        if (!socket) return;

        const onReceive = ({
            fromUserId,
            text,
            timestamp,
        }: {
            fromUserId: string;
            text: string;
            timestamp: number;
        }) => {
            setThreads((prev) => ({
                ...prev,
                [fromUserId]: [
                    ...(prev[fromUserId] ?? []),
                    { fromUserId, text, timestamp, direction: 'in' },
                ],
            }));
        };

        let offlineTimer = null as ReturnType<typeof setTimeout> | null;

        const onFailed = ({ toUserId }: { toUserId: string }) => {
            setOfflineUserId(toUserId);
            if (offlineTimer) clearTimeout(offlineTimer);
            offlineTimer = setTimeout(() => setOfflineUserId(null), 3000);
        };

        socket.on('receiveDm', onReceive);
        socket.on('dmFailed', onFailed);

        return () => {
            if (offlineTimer) clearTimeout(offlineTimer);
            socket.off('receiveDm', onReceive);
            socket.off('dmFailed', onFailed);
        };
    }, [socket]);

    const sendDm = useCallback(
        (toUserId: string, text: string) => {
            if (!socket) return;
            const trimmed = text.trim().slice(0, 500);
            if (!trimmed) return;

            setThreads((prev) => ({
                ...prev,
                [toUserId]: [
                    ...(prev[toUserId] ?? []),
                    {
                        fromUserId: 'me',
                        text: trimmed,
                        timestamp: Date.now(),
                        direction: 'out',
                    },
                ],
            }));
            socket.emit('sendDm', { toUserId, text: trimmed });
        },
        [socket],
    );

    const sendRoomInvite = useCallback(
        (toUserId: string, roomId: string, password: string) => {
            if (!socket) return;
            socket.emit('sendRoomInvite', { toUserId, roomId, password });
        },
        [socket],
    );

    return { threads, offlineUserId, sendDm, sendRoomInvite };
}
