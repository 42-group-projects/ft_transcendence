"use client";

import { useMemo, useState } from "react";

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
  const [mobileOpen, setMobileOpen] = useState(false);

  const onlineCount = useMemo(
    () => mockFriends.filter((friend) => friend.status === "online").length,
    [],
  );

  return (
    <>
      <div className="pointer-events-none absolute right-4 top-4 z-30 md:hidden">
        <div className="pointer-events-auto">
          <button
            type="button"
            onClick={() => setMobileOpen((value) => !value)}
            className="rounded-lg border border-neutral-700 bg-neutral-900/90 px-3 py-2 text-xs font-semibold text-neutral-200 backdrop-blur-md transition hover:bg-neutral-800"
            aria-expanded={mobileOpen}
            aria-controls="friends-dropdown"
          >
            Friends ({onlineCount})
          </button>

          {mobileOpen ? (
            <div
              id="friends-dropdown"
              className="mt-2 w-[min(88vw,20rem)] overflow-hidden rounded-2xl border border-neutral-700/80 bg-neutral-950/95 shadow-2xl shadow-black/40 backdrop-blur-md"
            >
              <div className="mb-3 mt-3 px-3">
                <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">Friends</p>
                <p className="mt-1 text-xs text-neutral-400">{onlineCount} online • {mockFriends.length} total</p>
              </div>

              <ul className="max-h-[45vh] space-y-2 overflow-y-auto px-3 pb-3">
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
            </div>
          ) : null}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-y-0 right-0 z-20 hidden items-start md:flex">
        <div
          id="friends-drawer"
          className="pointer-events-auto flex h-full w-[min(80vw,18rem)] flex-col overflow-hidden rounded-l-2xl border-l border-neutral-700/80 bg-neutral-950/90 shadow-2xl shadow-black/40 backdrop-blur-md sm:w-72"
        >
          <div className="mb-3 mt-3 px-3">
            <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">Friends</p>
            <p className="mt-1 text-xs text-neutral-400">{onlineCount} online • {mockFriends.length} total</p>
          </div>

          {/* TODO: Replace mockFriends with backend friend list and live status updates (WebSocket/presence API). */}
          <ul className="flex-1 space-y-2 overflow-y-auto px-3 pb-3">
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
        </div>
      </div>
    </>
  );
}
