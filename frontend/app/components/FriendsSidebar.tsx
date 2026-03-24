"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type FriendStatus = "online" | "offline";

type Friend = {
  id: string;
  name: string;
  status: FriendStatus;
};

const mockFriends: Friend[] = [
  { id: "1", name: "Mina", status: "online" },
  { id: "2", name: "Kenji", status: "offline" },
  { id: "3", name: "Aiko", status: "online" },
  { id: "4", name: "Daisuke", status: "offline" },
  { id: "5", name: "Rin", status: "online" },
];

export function FriendsSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragStateRef = useRef<{
    startClientX: number;
    startClientY: number;
    startOffsetX: number;
    startOffsetY: number;
  } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const onlineCount = useMemo(
    () => mockFriends.filter((friend) => friend.status === "online").length,
    [],
  );

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!dragStateRef.current) {
        return;
      }

      const deltaX = event.clientX - dragStateRef.current.startClientX;
      const deltaY = event.clientY - dragStateRef.current.startClientY;

      const newX = dragStateRef.current.startOffsetX - deltaX;
      const newY = dragStateRef.current.startOffsetY + deltaY;

      // Clamp so panel never leaves the map container.
      // The panel starts at right:8px top:16px, transform is translate(-x, y).
      // left edge = containerW - panelW - 8 - x  ≥ 8  →  x ≤ containerW - panelW - 16
      // right edge stays in  →  x ≥ 0
      // top edge = 16 + y  ≥ 8  →  y ≥ -8
      // bottom edge = 16 + y + panelH  ≤ containerH - 8  →  y ≤ containerH - panelH - 24
      const panel = panelRef.current;
      const container = panel?.parentElement?.parentElement;
      if (panel && container) {
        const pw = panel.offsetWidth;
        const ph = panel.offsetHeight;
        const cw = container.offsetWidth;
        const ch = container.offsetHeight;
        const pad = 8;
        const clampedX = Math.max(0, Math.min(newX, cw - pw - pad * 2));
        const clampedY = Math.max(-pad, Math.min(newY, ch - ph - 24));
        setOffset({ x: clampedX, y: clampedY });
      } else {
        setOffset({ x: newX, y: newY });
      }
    };

    const handlePointerUp = () => {
      dragStateRef.current = null;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, []);

  const handleDragStart = (event: React.PointerEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest("[data-no-drag='true']")) {
      return;
    }

    dragStateRef.current = {
      startClientX: event.clientX,
      startClientY: event.clientY,
      startOffsetX: offset.x,
      startOffsetY: offset.y,
    };
  };

  return (
    <div
      className="pointer-events-none absolute right-2 top-4 z-20 sm:right-4 sm:top-6"
      style={{ transform: `translate(${-offset.x}px, ${offset.y}px)` }}
    >
      <div
        ref={panelRef}
        onPointerDown={handleDragStart}
        className={[
          "pointer-events-auto overflow-hidden rounded-2xl border border-neutral-700/80 bg-neutral-950/90 shadow-2xl shadow-black/40 backdrop-blur-md transition-all duration-300",
          collapsed ? "w-12 p-2" : "w-[min(78vw,18rem)] p-3 sm:w-64 lg:w-72",
        ].join(" ")}
      >
        <button
          type="button"
          data-no-drag="true"
          onClick={() => setCollapsed((value) => !value)}
          className="flex w-full items-center justify-center rounded-lg border border-neutral-700 bg-neutral-900 px-2 py-2 text-xs font-semibold text-neutral-200 transition hover:bg-neutral-800"
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Open friends tab" : "Collapse friends tab"}
        >
          {collapsed ? "▶" : "Collapse"}
        </button>

        {collapsed ? (
          <div className="mt-2 flex flex-col items-center gap-2 px-1 pb-1">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-[10px] text-neutral-400">{onlineCount}</span>
          </div>
        ) : (
          <>
            <div className="mb-3 mt-3">
              <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">Friends</p>
              <p className="mt-1 text-xs text-neutral-400">{onlineCount} online • {mockFriends.length} total</p>
            </div>

            <ul className="max-h-[42vh] space-y-2 overflow-y-auto pr-1 sm:max-h-[52vh]">
              {mockFriends.map((friend) => (
                <li
                  key={friend.id}
                  className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-900/80 px-3 py-2"
                >
                  <span className="text-sm text-neutral-100">{friend.name}</span>
                  <span className="flex items-center gap-1.5 text-xs text-neutral-400">
                    <span
                      className={[
                        "h-2 w-2 rounded-full",
                        friend.status === "online" ? "bg-emerald-400" : "bg-neutral-600",
                      ].join(" ")}
                    />
                    {friend.status}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}

        {/* TODO: Replace mockFriends with backend friend list and live status updates (WebSocket/presence API). */}
      </div>
    </div>
  );
}