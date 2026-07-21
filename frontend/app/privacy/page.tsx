import Link from 'next/link';

export default function PrivacyPage() {
    return (
        <main className="min-h-screen bg-neutral-950 px-4 py-10 text-neutral-100 sm:px-6">
            <section className="mx-auto w-full max-w-3xl">
                <div className="mb-8">
                    <h1 className="mt-3 text-3xl font-semibold tracking-tight">
                        Privacy Policy
                    </h1>
                    <p className="mt-2 text-sm text-neutral-400">
                        Last updated: July 2026
                    </p>
                </div>

                <div className="space-y-8 text-sm leading-relaxed text-neutral-300">
                    <section>
                        <h2 className="mb-3 text-base font-semibold text-neutral-100">
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
                        <h2 className="mb-3 text-base font-semibold text-neutral-100">
                            2. Information We Collect
                        </h2>
                        <ul className="list-inside list-disc space-y-2 text-neutral-400">
                            <li>
                                <span className="text-neutral-300">
                                    Account information
                                </span>{' '}
                                — email address, nickname, and hashed password
                                provided at registration.
                            </li>
                            <li>
                                <span className="text-neutral-300">
                                    Game data
                                </span>{' '}
                                — match results, win/loss records, and rating
                                score.
                            </li>
                            <li>
                                <span className="text-neutral-300">
                                    Avatar image
                                </span>{' '}
                                — an optional profile picture you upload
                                yourself.
                            </li>
                            <li>
                                <span className="text-neutral-300">
                                    Social data
                                </span>{' '}
                                — friend relationships and in-app direct
                                messages between friends.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="mb-3 text-base font-semibold text-neutral-100">
                            3. How We Use Your Information
                        </h2>
                        <p className="text-neutral-400">
                            Your data is used solely to operate the game:
                            authenticate your account, display your profile and
                            stats, enable matchmaking, and power the friends and
                            chat features. We do not sell, rent, or share your
                            data with anyone.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-base font-semibold text-neutral-100">
                            4. Data Storage
                        </h2>
                        <p className="text-neutral-400">
                            All data is stored in a PostgreSQL database running
                            inside a Docker container on the project host. No
                            external cloud storage or analytics services are
                            used. Passwords are hashed and never stored in plain
                            text.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-base font-semibold text-neutral-100">
                            5. Cookies & Tokens
                        </h2>
                        <p className="text-neutral-400">
                            SumoVerse uses a single JWT access token stored in
                            your browser&apos;s localStorage and as a cookie for
                            authentication. No tracking or advertising cookies
                            are used.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-base font-semibold text-neutral-100">
                            6. Your Rights
                        </h2>
                        <p className="text-neutral-400">
                            You can delete your account and all associated data
                            at any time by contacting a project administrator.
                            As this is a school project, formal data subject
                            request processes are not applicable.
                        </p>
                    </section>

                    <section>
                        <h2 className="mb-3 text-base font-semibold text-neutral-100">
                            7. Contact
                        </h2>
                        <p className="text-neutral-400">
                            This project is maintained by 42 School students.
                            For any questions about your data, please reach out
                            to the project team directly.
                        </p>
                    </section>
                </div>

                <div className="mt-10 flex items-center gap-4 text-sm text-neutral-400">
                    <span className="text-neutral-700">|</span>
                    <Link
                        href="/lobby"
                        className="transition hover:text-neutral-100"
                    >
                        Back
                    </Link>
                    <span className="text-neutral-700">|</span>
                </div>
            </section>
        </main>
    );
}
