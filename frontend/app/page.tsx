import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl flex-col items-center justify-center gap-6 px-6 text-center">
        <h1 className="text-5xl font-bold tracking-tight">SumoVerse</h1>
        <p className="max-w-xl text-neutral-300">
          Welcome to SumoVerse. This is a temporary landing page while we build the
          full experience.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/lobby"
            className="rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
          >
            Enter Game (Temporary Link)
          </Link>
        </div>
      </section>
    </main>
  );
}
