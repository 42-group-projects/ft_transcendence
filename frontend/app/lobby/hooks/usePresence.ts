import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4002';

export const usePresence = (currentUserId: string, friendIds: string[]) => {
  const [onlineFriends, setOnlineFriends] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!currentUserId) return;

    // TODO: [JWT統合] ソケット接続時の認証をJWTトークンに切り替える
    // バックエンドのSocketサーバーがJWTを検証する仕様になったら、
    // `userId` を直接送るのではなく、localStorage等から取得したトークンを送るように修正する
    /* --- JWT完成後に戻すコード ---
    import { getToken } from '@/lib/api';
    const socket: Socket = io(SOCKET_URL, {
      auth: { token: getToken() }
    });
    ----------------------------- */

    // テスト用コード（JWT完成後に削除）
    const socket: Socket = io(SOCKET_URL, {
      auth: { userId: currentUserId } 
    });
    // テスト用コード（JWT完成後に削除）

    // 接続成功時、初期ステータスを取得する
    socket.on('connect', () => {
      if (friendIds.length > 0) {
        socket.emit('get_users_status', friendIds, (initialStatuses: Record<string, string>) => {
          setOnlineFriends(prev => ({ ...prev, ...initialStatuses }));
        });
      }
    });

    // 誰かのステータスが変わった時のリアルタイム通知を受け取る
    socket.on('user_status_changed', ({ userId, status }) => {
      setOnlineFriends((prev) => ({ ...prev, [userId]: status }));
    });

    return () => {
      socket.disconnect();
    };
  }, [currentUserId, JSON.stringify(friendIds)]);

  return onlineFriends;
};
