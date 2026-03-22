import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <section className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 px-6 text-center">
        <h1 className="text-5xl font-bold tracking-tight">SumoVerse</h1>
        <Link
          href="/game/multiplayer"
          className="rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
        >
          Multiplayer
        </Link>
        <Link
          href="/game/solo"
          className="rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
        >
          Solo
        </Link>
        <Link
          href="/game/solo-dev"
          className="rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
        >
          Solo Dev Mode
        </Link>
      </section>
    </main>
  );
}