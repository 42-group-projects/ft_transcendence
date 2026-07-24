import Link from 'next/link';

export default function Home() {
    return (
        <main className="min-h-screen bg- text-stone-900">
            <section className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 px-6 text-center">
                <h1 className="text-5xl font-bold tracking-tight text-stone-950">
                    SumoVerse
                </h1>
                <Link
                    href="/game/multiplayer"
                    className="bg-red-900 px-6 py-3 text-sm font-semibold text- transition-colors hover:bg-red-800"
                >
                    Multiplayer
                </Link>
                <Link
                    href="/game/solo"
                    className="bg-red-900 px-6 py-3 text-sm font-semibold text- transition-colors hover:bg-red-800"
                >
                    Solo
                </Link>
            </section>
        </main>
    );
}
