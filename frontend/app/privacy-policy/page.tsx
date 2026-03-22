import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | SumoVerse",
  description: "SumoVerse Privacy Policy — how we collect, use, and protect your personal information.",
};

export default function PrivacyPolicy() {
  return (
    <div className="flex min-h-screen flex-col bg-white font-sans dark:bg-black">
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-black dark:text-zinc-50">
          Privacy Policy
        </h1>
        <p className="mb-10 text-sm text-zinc-500 dark:text-zinc-400">
          Effective date: March 22, 2026
        </p>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold text-black dark:text-zinc-50">
            1. About SumoVerse
          </h2>
          <p className="leading-7 text-zinc-700 dark:text-zinc-300">
            SumoVerse is a browser-based, real-time 3D sumo wrestling game built
            as the ft_transcendence final project by a team of four 42 School
            students. Players create accounts, compete against each other or an
            AI opponent on a virtual dohyo, and track their results on a global
            leaderboard. This Privacy Policy explains what personal data we
            collect, why we collect it, how we protect it, and your rights
            regarding that data.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold text-black dark:text-zinc-50">
            2. Data We Collect
          </h2>
          <p className="mb-3 leading-7 text-zinc-700 dark:text-zinc-300">
            We collect only the information necessary to provide the service:
          </p>
          <ul className="list-inside list-disc space-y-2 leading-7 text-zinc-700 dark:text-zinc-300">
            <li>
              <strong>Account information:</strong> email address, hashed
              password (bcrypt), and the nickname you choose when registering.
            </li>
            <li>
              <strong>Avatar image:</strong> an optional profile picture you
              upload or a URL you provide. If none is provided, a default avatar
              is shown.
            </li>
            <li>
              <strong>OAuth profile data:</strong> if you sign in via Google or
              GitHub OAuth 2.0, we receive your email address and public profile
              name from that provider. We do not receive or store your OAuth
              provider password.
            </li>
            <li>
              <strong>Game statistics:</strong> win/loss records, match history
              (opponent, date, result), and your ranking score.
            </li>
            <li>
              <strong>Technical data:</strong> server-side logs may record IP
              addresses, browser user-agent strings, and timestamps solely for
              security monitoring and debugging purposes.
            </li>
          </ul>
          <p className="mt-3 leading-7 text-zinc-700 dark:text-zinc-300">
            We do <strong>not</strong> collect payment information, physical
            addresses, or any sensitive personal data.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold text-black dark:text-zinc-50">
            3. How We Use Your Data
          </h2>
          <ul className="list-inside list-disc space-y-2 leading-7 text-zinc-700 dark:text-zinc-300">
            <li>To create and manage your player account.</li>
            <li>
              To authenticate you via JWT-based sessions or OAuth 2.0 tokens.
            </li>
            <li>
              To display your nickname, avatar, and statistics on your profile
              and the global leaderboard.
            </li>
            <li>
              To enable real-time multiplayer matchmaking and in-game
              communication via WebSocket.
            </li>
            <li>
              To record match results and compute rankings after each game.
            </li>
            <li>
              To maintain the security and integrity of the service (fraud
              prevention, abuse detection).
            </li>
          </ul>
          <p className="mt-3 leading-7 text-zinc-700 dark:text-zinc-300">
            We do <strong>not</strong> sell, rent, or share your personal data
            with third parties for marketing purposes.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold text-black dark:text-zinc-50">
            4. Authentication &amp; Sessions
          </h2>
          <p className="leading-7 text-zinc-700 dark:text-zinc-300">
            After login, SumoVerse issues a JSON Web Token (JWT) to maintain
            your session. Tokens are short-lived and invalidated on logout.
            OAuth 2.0 flows with Google or GitHub redirect you through the
            provider&apos;s own authentication page; SumoVerse only stores the
            resulting access token and the minimal profile data described in
            Section 2.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold text-black dark:text-zinc-50">
            5. Data Storage &amp; Security
          </h2>
          <p className="leading-7 text-zinc-700 dark:text-zinc-300">
            User data is stored in a PostgreSQL database. Passwords are hashed
            with bcrypt before storage and are never saved or logged in plain
            text. Database credentials and API keys are managed exclusively
            through environment variables and are never committed to the
            repository. All communication between the client and server uses
            HTTPS (TLS). We apply input validation and parameterised queries to
            protect against SQL injection and XSS attacks. Despite these
            measures, no internet-based system can guarantee absolute security.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold text-black dark:text-zinc-50">
            6. Data Retention
          </h2>
          <p className="leading-7 text-zinc-700 dark:text-zinc-300">
            Your account and associated data are retained for as long as your
            account remains active. If you request account deletion, we will
            remove your personal information from our database within 30 days,
            except where retention is required to comply with legal obligations.
            Anonymised aggregate statistics (e.g., total matches played) may be
            retained indefinitely.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold text-black dark:text-zinc-50">
            7. Your Rights
          </h2>
          <p className="mb-3 leading-7 text-zinc-700 dark:text-zinc-300">
            You have the right to:
          </p>
          <ul className="list-inside list-disc space-y-2 leading-7 text-zinc-700 dark:text-zinc-300">
            <li>
              <strong>Access</strong> the personal data we hold about you.
            </li>
            <li>
              <strong>Correct</strong> inaccurate information via your profile
              settings.
            </li>
            <li>
              <strong>Delete</strong> your account and all associated personal
              data.
            </li>
            <li>
              <strong>Export</strong> your game statistics and match history on
              request.
            </li>
          </ul>
          <p className="mt-3 leading-7 text-zinc-700 dark:text-zinc-300">
            To exercise any of these rights, contact us at the address in
            Section 9.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold text-black dark:text-zinc-50">
            8. Third-Party Services
          </h2>
          <p className="leading-7 text-zinc-700 dark:text-zinc-300">
            SumoVerse may be deployed on Vercel for the frontend and uses
            Docker Compose for local and production infrastructure. Real-time
            game communication is handled by Socket.io. These providers have
            their own privacy policies which we encourage you to review. We do
            not control the data practices of these providers.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold text-black dark:text-zinc-50">
            9. Contact
          </h2>
          <p className="leading-7 text-zinc-700 dark:text-zinc-300">
            SumoVerse is a student project developed at 42 School. If you have
            any questions or requests regarding your personal data, please open
            an issue in the project&apos;s{" "}
            <a
              href="https://github.com/42-group-projects/ft_transcendence"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-zinc-900 underline underline-offset-2 hover:text-black dark:text-zinc-100 dark:hover:text-white"
            >
              GitHub repository
            </a>
            .
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold text-black dark:text-zinc-50">
            10. Changes to This Policy
          </h2>
          <p className="leading-7 text-zinc-700 dark:text-zinc-300">
            We may update this Privacy Policy as the project evolves. Any
            significant changes will be announced via a commit to the repository
            and the effective date at the top of this page will be updated.
            Continued use of SumoVerse after changes are posted constitutes
            acceptance of the revised policy.
          </p>
        </section>

        <div className="mt-10 border-t border-black/[.08] pt-8 dark:border-white/[.1]">
          <Link
            href="/"
            className="text-sm font-medium text-zinc-700 underline underline-offset-2 hover:text-black dark:text-zinc-300 dark:hover:text-white"
          >
            ← Back to home
          </Link>
        </div>
      </main>
    </div>
  );
}
