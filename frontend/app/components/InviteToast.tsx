'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePresenceSocket } from './PresenceProvider';

type PendingInvite = {
    fromUserId: string;
    roomId: string;
    password: string;
};

export function InviteToast() {
    const socket = usePresenceSocket();
    const router = useRouter();
    const [invite, setInvite] = useState<PendingInvite | null>(null);

    useEffect(() => {
        if (!socket) return;

        const onInvite = (data: PendingInvite) => {
            // Replace any existing pending invite with the newest one
            setInvite(data);
        };

        socket.on('receiveRoomInvite', onInvite);
        return () => {
            socket.off('receiveRoomInvite', onInvite);
        };
    }, [socket]);

    if (!invite) return null;

    const handleAccept = () => {
        const params = new URLSearchParams({
            join: invite.roomId,
            pw: invite.password,
        });
        router.push(`/game/multiplayer?${params.toString()}`);
        setInvite(null);
    };

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-3 shadow-xl max-w-xs text-sm text-neutral-100">
            <p className="font-medium">
                Match invite from{' '}
                <span className="text-orange-400">
                    {invite.fromUserId.substring(0, 8)}…
                </span>
            </p>
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={handleAccept}
                    className="flex-1 rounded bg-orange-500/20 py-1 text-xs text-orange-400 transition hover:bg-orange-500/40"
                >
                    Accept
                </button>
                <button
                    type="button"
                    onClick={() => setInvite(null)}
                    className="flex-1 rounded bg-neutral-700 py-1 text-xs text-neutral-300 transition hover:bg-neutral-600"
                >
                    Dismiss
                </button>
            </div>
        </div>
    );
}
