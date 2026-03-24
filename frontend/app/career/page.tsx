import Link from "next/link";

export default function CareerPage() {
  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-6 text-neutral-100 sm:px-6 lg:px-8">
      <section className="mx-auto flex min-h-[calc(100vh-6.5rem)] w-full max-w-4xl items-center justify-center">
        <div className="w-full max-w-2xl rounded-2xl border border-neutral-800 bg-neutral-900 p-8 text-center shadow-2xl shadow-black/30">
          <p className="text-sm uppercase tracking-[0.3em] text-neutral-500">Career</p>
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
        </div>
      </section>
    </main>
  );
}