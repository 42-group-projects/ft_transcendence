import Link from 'next/link';

export function Footer() {
    return (
        <footer className="border-t border-neutral-800 bg-neutral-950 px-4 py-6 sm:px-6">
            <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
                <p className="text-sm text-neutral-500">
                    &copy; {new Date().getFullYear()} SumoVerse. All rights
                    reserved.
                </p>

                <div className="flex items-center gap-4 text-sm">
                    <Link
                        href="/terms"
                        className="text-neutral-400 transition hover:text-neutral-100"
                    >
                        Terms of Service
                    </Link>
                    <span className="text-neutral-700">|</span>
                    <Link
                        href="/privacy"
                        className="text-neutral-400 transition hover:text-neutral-100"
                    >
                        Privacy Policy
                    </Link>
                </div>
            </div>
        </footer>
    );
}
