import Link from 'next/link';

type GameResultOverlayProps = {
    title: string;
    description?: string | null;
};

export function GameResultOverlay({
    title,
    description,
}: GameResultOverlayProps) {
    return (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-neutral-950/70 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl border border-neutral-700 bg-neutral-900/95 p-6 text-center shadow-2xl shadow-black/40">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-indigo-300">
                    Match finished
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-white">
                    {title}
                </h2>
                {description ? (
                    <p className="mt-3 text-sm text-neutral-300">
                        {description}
                    </p>
                ) : null}
                <Link
                    href="/lobby"
                    className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500"
                >
                    Return to Lobby
                </Link>
            </div>
        </div>
    );
}
