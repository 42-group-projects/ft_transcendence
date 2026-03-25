import Link from "next/link";

export default function CareerPage() {
  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-6 text-neutral-100 sm:px-6 lg:px-8">
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Career Placeholder</h1>
          <p className="mt-4 text-neutral-300">
            This page will later show career progress, milestones, and unlocks from backend data.
          </p>

          {/* TODO: Connect this page to backend endpoints for career progression and achievements. */}

          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              href="/lobby"
              className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              Back to Lobby
            </Link>
          </div>
    </main>
  );
}