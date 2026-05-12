"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { getToken } from "@/lib/api";
import { resolveSocketUrl } from "@/app/game/socket-url";

// Expose socket as state so consumers re-render (and re-run effects) when it appears.
const PresenceContext = createContext<Socket | null>(null);

export function usePresenceSocket() {
  return useContext(PresenceContext);
}

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    function connect() {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }

      const token = getToken();
      if (!token) return;

      const s = io(resolveSocketUrl(), { auth: { token } });
      socketRef.current = s;
      setSocket(s);
    }

    connect();

    // Re-run whenever login or logout fires
    window.addEventListener("auth-changed", connect);
    return () => {
      window.removeEventListener("auth-changed", connect);
      socketRef.current?.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, []);

  return (
    <PresenceContext.Provider value={socket}>
      {children}
    </PresenceContext.Provider>
  );
}
