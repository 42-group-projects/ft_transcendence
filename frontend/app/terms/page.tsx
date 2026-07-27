import Link from 'next/link';

export default function TermsPage() {
    return (
        <main className="relative min-h-screen bg- px-4 py-10 text-stone-900 sm:px-6 overflow-hidden">
            <div className="pointer-events-none absolute inset-0 top-0 flex items-start justify-center">
                <div className="h-[1200px] w-full max-w-3xl bg-gradient-to-r from-yellow-200/30 via-yellow-100/40 to-yellow-200/30 blur-3xl" />
            </div>
            <section className="relative mx-auto w-full max-w-3xl">
                <div className="mb-8">
                    <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-950">
                        Terms of Service
                    </h1>
                    <p className="mt-2 text-sm text-stone-700">
                        Last updated: July 2026
                    </p>
                </div>

                <div className="space-y-8 text-sm leading-relaxed text-stone-700">
                    <section>
                        <h2 className="mb-3 text-base font-semibold text-stone-900">
                            1. About SumoVerse
                        </h2>
                        <p>
                            SumoVerse is a browser-based multiplayer sumo
                            wrestling game developed as a student project at 42
                            School. By creating an account and using the
                            platform, you agree to these terms.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-base font-semibold text-stone-900">
                            2. Accounts
                        </h2>
                        <ul className="list-inside list-disc space-y-2 text-stone-700">
                            <li>
                                You must provide a valid email address and a
                                unique nickname to register.
                            </li>
                            <li>
                                You are responsible for keeping your login
                                credentials secure.
                            </li>
                            <li>
                                One account per person. Creating multiple
                                accounts to manipulate rankings is not allowed.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="mb-3 text-base font-semibold text-stone-900">
                            3. Acceptable Use
                        </h2>
                        <p className="mb-2 text-stone-700">
                            When using SumoVerse you agree not to:
                        </p>
                        <ul className="list-inside list-disc space-y-2 text-stone-700">
                            <li>
                                Harass, abuse, or threaten other players via
                                chat or any other feature.
                            </li>
                            <li>
                                Exploit bugs or use external tools to gain an
                                unfair advantage in matches.
                            </li>
                            <li>
                                Attempt to access or interfere with the server,
                                database, or another user&apos;s account.
                            </li>
                            <li>
                                Upload avatars or send messages containing
                                illegal, offensive, or inappropriate content.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="mb-3 text-base font-semibold text-stone-900">
                            4. Game & Rankings
                        </h2>
                        <p className="text-stone-700">
                            Match results and rating changes are recorded
                            automatically by the server. Ratings are calculated
                            based on match outcomes. The project team reserves
                            the right to reset or adjust data for testing and
                            development purposes.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-base font-semibold text-stone-900">
                            5. Availability
                        </h2>
                        <p className="text-stone-700">
                            SumoVerse is a student project and is provided as-is
                            with no guarantees of uptime or continued
                            availability. The service may be taken offline at
                            any time without notice.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-base font-semibold text-stone-900">
                            6. Limitation of Liability
                        </h2>
                        <p className="text-stone-700">
                            This platform is a non-commercial educational
                            project. The developers are not liable for any loss
                            of data, service interruptions, or any other issues
                            arising from use of the platform.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-base font-semibold text-stone-900">
                            7. Changes to These Terms
                        </h2>
                        <p className="text-stone-700">
                            These terms may be updated as the project evolves.
                            Continued use of the platform after changes
                            constitutes acceptance of the updated terms.
                        </p>
                    </section>
                </div>

                <div className="mt-10 flex items-stretch gap-4 text-sm text-stone-700">
                    <Link
                        href="/lobby"
                        className="border-2 border-stone-400 bg-yellow-100 px-4 py-2 text-sm font-medium text-stone-900 transition hover:bg-stone-200"
                    >
                        Back
                    </Link>
                </div>
            </section>
        </main>
    );
}
