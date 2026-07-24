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
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/10 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm border-2 border-neutral-600 bg-yellow-50 p-6 text-center shadow-lg shadow-red-900/10">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-red-900">
                    Match finished
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-stone-950">
                    {title}
                </h2>
                {description ? (
                    <p className="mt-3 text-sm text-stone-700">{description}</p>
                ) : null}
                <Link
                    href="/lobby"
                    className="mt-6 inline-flex w-full items-center justify-center bg-red-900 px-4 py-2.5 text-sm font-medium text-yellow-50 transition hover:bg-red-800"
                >
                    Return to Lobby
                </Link>
            </div>
        </div>
    );
}
