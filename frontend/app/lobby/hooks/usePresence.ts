import { useEffect, useState } from 'react';
import { usePresenceSocket } from '@/app/components/PresenceProvider';

export const usePresence = (currentUserId: string, friendIds: string[]) => {
    const [onlineFriends, setOnlineFriends] = useState<Record<string, string>>(
        {},
    );
    // Use the shared socket from PresenceProvider (lives in root layout,
    // persists across page navigations so users never appear offline mid-session).
    // socket is null until PresenceProvider connects — effects re-run when it arrives.
    const socket = usePresenceSocket();

    useEffect(() => {
        if (!currentUserId || !socket) return;

        // 誰かのステータスが変わった時のリアルタイム通知を受け取る
        const onStatusChanged = ({
            userId,
            status,
        }: {
            userId: string;
            status: string;
        }) => {
            setOnlineFriends((prev) => ({ ...prev, [userId]: status }));
        };
        socket.on('user_status_changed', onStatusChanged);

        return () => {
            socket.off('user_status_changed', onStatusChanged);
        };
    }, [currentUserId, socket]);

    // フレンドリストが変わった時、既存のソケット接続で再購読する
    const friendKey = [...friendIds].sort().join(',');
    useEffect(() => {
        if (!socket || friendIds.length === 0) return;

        const subscribe = () => {
            socket.emit(
                'get_users_status',
                friendIds,
                (initialStatuses: Record<string, string>) => {
                    setOnlineFriends((prev) => ({
                        ...prev,
                        ...initialStatuses,
                    }));
                },
            );
        };

        if (socket.connected) {
            subscribe();
        } else {
            socket.once('connect', subscribe);
            return () => {
                socket.off('connect', subscribe);
            };
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [friendKey, socket]);

    return onlineFriends;
};
