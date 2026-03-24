import Link from "next/link";

import { FriendsSidebar } from "@/app/components/FriendsSidebar";

const mockProfile = {
  displayName: "Player One",
  rankLabel: "Rookie Wrestler",
  avatarInitials: "PO",
};

const roomLinks = [
  {
    href: "/game/solo",
    title: "Solo room",
    description: "Practice movement, test AI levels, and warm up offline.",
    accentClassName: "border-blue-500/40 bg-blue-500/10 text-blue-100 hover:bg-blue-500/20",
  },
  {
    href: "/game/multiplayer",
    title: "Multiplayer room",
    description: "Join a shared room and test live matches with other players.",
    accentClassName: "border-orange-500/40 bg-orange-500/10 text-orange-100 hover:bg-orange-500/20",
  },
  {
    href: "/profile",
    title: "Profile",
    description: "View and edit your profile details and avatar settings.",
    accentClassName: "border-neutral-500/40 bg-neutral-500/10 text-neutral-100 hover:bg-neutral-500/20",
  },
  {
    href: "/career",
    title: "Career",
    description: "Check milestones, progress, and future career unlocks.",
    accentClassName: "border-emerald-500/40 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/20",
  },
  {
    href: "/ranking",
    title: "Ranking",
    description: "See leaderboard standings and competitive ranking info.",
    accentClassName: "border-fuchsia-500/40 bg-fuchsia-500/10 text-fuchsia-100 hover:bg-fuchsia-500/20",
  },
];

export default function LobbyPage() {
  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-6 text-neutral-100 sm:px-6 lg:px-8">
      <section className="mx-auto flex min-h-[calc(100vh-6.5rem)] w-full max-w-6xl flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-neutral-500">Lobby</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Choose your next match</h1>
          </div>
          <Link
            href="/"
            className="rounded-md border border-neutral-700 px-4 py-2 text-sm font-medium text-neutral-200 transition hover:bg-neutral-900"
          >
            Back home
          </Link>
        </div>

        <div className="relative flex-1 overflow-hidden rounded-[2rem] border border-neutral-800 bg-neutral-900 shadow-2xl shadow-black/30">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.22),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(249,115,22,0.18),_transparent_30%),linear-gradient(180deg,_rgba(23,23,23,0.95),_rgba(10,10,10,1))]" />
          <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:60px_60px]" />
          <div className="absolute left-[18%] top-[22%] h-24 w-24 rounded-full border border-blue-400/20 bg-blue-400/10 blur-sm" />
          <div className="absolute bottom-[20%] right-[18%] h-32 w-32 rounded-full border border-orange-400/20 bg-orange-400/10 blur-sm" />
          <div className="absolute left-[24%] top-[48%] h-px w-[18%] -rotate-12 bg-gradient-to-r from-blue-400/50 to-transparent" />
          <div className="absolute right-[25%] top-[40%] h-px w-[16%] rotate-[18deg] bg-gradient-to-r from-orange-400/50 to-transparent" />

          <FriendsSidebar />

          <div className="relative z-10 flex h-full flex-col p-4 sm:p-6">
            <div className="flex flex-wrap gap-2 lg:gap-3">
              {roomLinks.map((room) => (
                <Link
                  key={room.href}
                  href={room.href}
                  className={`w-full min-w-0 rounded-xl border px-3 py-3 text-left backdrop-blur-sm transition sm:w-[calc(50%-0.25rem)] lg:w-[calc(20%-0.6rem)] ${room.accentClassName}`}
                >
                  <span className="block text-sm font-semibold">{room.title}</span>
                  <span className="mt-1 block text-xs text-neutral-300">{room.description}</span>
                </Link>
              ))}
            </div>

            <div className="flex flex-1 items-start justify-center py-6 md:items-center md:py-8">
              <div className="w-full max-w-xs rounded-[2rem] border border-neutral-700/80 bg-neutral-950/80 p-6 text-center shadow-2xl shadow-black/40 backdrop-blur-md sm:max-w-sm sm:p-8">
                <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border-4 border-neutral-700 bg-gradient-to-br from-neutral-700 via-neutral-800 to-neutral-900 text-4xl font-semibold tracking-wide text-white shadow-lg shadow-black/30 sm:h-32 sm:w-32">
                  {mockProfile.avatarInitials}
                </div>
                <p className="mt-6 text-sm uppercase tracking-[0.3em] text-neutral-500">Current avatar</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight">{mockProfile.displayName}</h2>
                <p className="mt-2 text-sm text-neutral-400">{mockProfile.rankLabel}</p>

                <Link
                  href="/profile"
                  className="mt-6 inline-flex rounded-lg border border-neutral-600 px-5 py-3 text-sm font-medium text-neutral-100 transition hover:bg-neutral-800"
                >
                  Edit profile / avatar
                </Link>

                {/* TODO: Connect this button to the future profile editor or avatar customization flow. */}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}