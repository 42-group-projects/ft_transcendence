import Link from 'next/link';

export default function PrivacyPage() {
    return (
        <main className="relative min-h-screen bg- px-4 py-10 text-stone-900 sm:px-6 overflow-hidden">
            <div className="pointer-events-none absolute inset-0 top-0 flex items-start justify-center">
                <div className="h-[1200px] w-full max-w-3xl bg-gradient-to-r from-yellow-200/30 via-yellow-100/40 to-yellow-200/30 blur-3xl" />
            </div>
            <section className="relative mx-auto w-full max-w-3xl">
                <div className="mb-8">
                    <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-950">
                        Privacy Policy
                    </h1>
                    <p className="mt-2 text-sm text-stone-700">
                        Last updated: July 2026
                    </p>
                </div>

                <div className="space-y-8 text-sm leading-relaxed text-stone-700">
                    <section>
                        <h2 className="mb-3 text-base font-semibold text-stone-900">
                            1. Overview
                        </h2>
                        <p>
                            SumoVerse is a student project built as part of the
                            42 School curriculum. This privacy policy explains
                            what information we collect when you use the
                            platform and how it is used. Because this is a
                            school project, no data is shared with third parties
                            or used for commercial purposes.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-base font-semibold text-stone-900">
                            2. Information We Collect
                        </h2>
                        <ul className="list-inside list-disc space-y-2 text-stone-700">
                            <li>
                                <span className="text-stone-800">
                                    Account information
                                </span>{' '}
                                — email address, nickname, and hashed password
                                provided at registration.
                            </li>
                            <li>
                                <span className="text-stone-800">
                                    Game data
                                </span>{' '}
                                — match results, win/loss records, and rating
                                score.
                            </li>
                            <li>
                                <span className="text-stone-800">
                                    Avatar image
                                </span>{' '}
                                — an optional profile picture you upload
                                yourself.
                            </li>
                            <li>
                                <span className="text-stone-800">
                                    Social data
                                </span>{' '}
                                — friend relationships and in-app direct
                                messages between friends.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="mb-3 text-base font-semibold text-stone-900">
                            3. How We Use Your Information
                        </h2>
                        <p className="text-stone-700">
                            Your data is used solely to operate the game:
                            authenticate your account, display your profile and
                            stats, enable matchmaking, and power the friends and
                            chat features. We do not sell, rent, or share your
                            data with anyone.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-base font-semibold text-stone-900">
                            4. Data Storage
                        </h2>
                        <p className="text-stone-700">
                            All data is stored in a PostgreSQL database running
                            inside a Docker container on the project host. No
                            external cloud storage or analytics services are
                            used. Passwords are hashed and never stored in plain
                            text.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-base font-semibold text-stone-900">
                            5. Cookies & Tokens
                        </h2>
                        <p className="text-stone-700">
                            SumoVerse uses a single JWT access token stored in
                            your browser's localStorage and as a cookie for
                            authentication. No tracking or advertising cookies
                            are used.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-base font-semibold text-stone-900">
                            6. Your Rights
                        </h2>
                        <p className="text-stone-700">
                            You can delete your account and all associated data
                            at any time by contacting a project administrator.
                            As this is a school project, formal data subject
                            request processes are not applicable.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-base font-semibold text-stone-900">
                            7. Contact
                        </h2>
                        <p className="text-stone-700">
                            This project is maintained by 42 School students.
                            For any questions about your data, please reach out
                            to the project team directly.
                        </p>
                    </section>
                </div>

                <div className="mt-10 flex items-center gap-4 text-sm text-stone-700">
                    <span className="text-stone-600">|</span>
                    <Link
                        href="/lobby"
                        className="border-2 border-stone-400 bg-yellow-100 px-4 py-2 text-sm font-medium text-stone-900 transition hover:bg-stone-200"
                    >
                        Back
                    </Link>
                    <span className="text-stone-600">|</span>
                </div>
            </section>
        </main>
    );
}
