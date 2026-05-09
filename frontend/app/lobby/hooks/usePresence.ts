import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { getToken } from "@/lib/api";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

export const usePresence = (currentUserId: string, friendIds: string[]) => {
  const [onlineFriends, setOnlineFriends] = useState<Record<string, string>>(
    {},
  );
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!currentUserId) return;

    const token = getToken();
    if (!token) return;

    const socket: Socket = io(SOCKET_URL, {
      auth: { token },
    });

    socketRef.current = socket;

    // 接続成功時、初期ステータスを取得する
    socket.on("connect", () => {
      if (friendIds.length > 0) {
        socket.emit(
          "get_users_status",
          friendIds,
          (initialStatuses: Record<string, string>) => {
            setOnlineFriends((prev) => ({ ...prev, ...initialStatuses }));
          },
        );
      }
    });

    // 誰かのステータスが変わった時のリアルタイム通知を受け取る
    socket.on("user_status_changed", ({ userId, status }) => {
      setOnlineFriends((prev) => ({ ...prev, [userId]: status }));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [currentUserId]);

  // フレンドリストが変わった時、既存のソケット接続で再購読する
  const friendKey = [...friendIds].sort().join(",");
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !socket.connected || friendIds.length === 0) return;

    socket.emit(
      "get_users_status",
      friendIds,
      (initialStatuses: Record<string, string>) => {
        setOnlineFriends((prev) => ({ ...prev, ...initialStatuses }));
      },
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [friendKey]);

  return onlineFriends;
};
