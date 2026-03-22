import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | SumoVerse",
  description: "SumoVerse Terms of Service — the rules and conditions for using the platform.",
};

export default function TermsOfService() {
  return (
    <div className="flex min-h-screen flex-col bg-white font-sans dark:bg-black">
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-black dark:text-zinc-50">
          Terms of Service
        </h1>
        <p className="mb-10 text-sm text-zinc-500 dark:text-zinc-400">
          Effective date: March 22, 2026
        </p>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold text-black dark:text-zinc-50">
            1. About the Service
          </h2>
          <p className="leading-7 text-zinc-700 dark:text-zinc-300">
            SumoVerse is a browser-based, real-time 3D sumo wrestling game
            developed as a student project (ft_transcendence) at 42 School. The
            service lets players register accounts, compete in one-on-one sumo
            matches against other players or an AI opponent, and track their
            results on a global leaderboard. By accessing or using SumoVerse you
            agree to these Terms of Service in full.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold text-black dark:text-zinc-50">
            2. Eligibility
          </h2>
          <p className="leading-7 text-zinc-700 dark:text-zinc-300">
            SumoVerse is intended for users of all ages. Because the project is
            an academic exercise, no commercial age-gate applies; however, users
            under 13 should obtain parental consent before creating an account.
            By registering you confirm that the information you provide is
            accurate.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold text-black dark:text-zinc-50">
            3. Account Registration &amp; Security
          </h2>
          <ul className="list-inside list-disc space-y-2 leading-7 text-zinc-700 dark:text-zinc-300">
            <li>
              You may register with an email address and password, or via Google
              or GitHub OAuth 2.0.
            </li>
            <li>
              You are responsible for keeping your credentials confidential. Do
              not share your password with others.
            </li>
            <li>
              You are responsible for all activity that occurs under your
              account.
            </li>
            <li>
              If you suspect unauthorised access to your account, you must
              notify us immediately by opening an issue in the GitHub repository
              and change your password.
            </li>
            <li>
              We reserve the right to suspend or terminate accounts that violate
              these Terms.
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold text-black dark:text-zinc-50">
            4. Acceptable Use
          </h2>
          <p className="mb-3 leading-7 text-zinc-700 dark:text-zinc-300">
            When using SumoVerse you agree <strong>not</strong> to:
          </p>
          <ul className="list-inside list-disc space-y-2 leading-7 text-zinc-700 dark:text-zinc-300">
            <li>
              Cheat, exploit bugs, or use automated bots to gain an unfair
              advantage in matches.
            </li>
            <li>
              Attempt to access, modify, or disrupt the server infrastructure,
              database, or other players&apos; accounts.
            </li>
            <li>
              Upload avatar images or choose nicknames that contain offensive,
              hateful, or illegal content.
            </li>
            <li>
              Attempt to reverse-engineer or decompile any part of the service
              beyond what is publicly available in the open-source repository.
            </li>
            <li>
              Perform denial-of-service attacks or send excessive requests that
              degrade the service for other users.
            </li>
            <li>
              Use the service for any unlawful purpose or in violation of any
              applicable laws.
            </li>
          </ul>
          <p className="mt-3 leading-7 text-zinc-700 dark:text-zinc-300">
            Violations may result in immediate account suspension and, where
            necessary, will be reported to the relevant authorities.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold text-black dark:text-zinc-50">
            5. Game Rules &amp; Fair Play
          </h2>
          <p className="leading-7 text-zinc-700 dark:text-zinc-300">
            SumoVerse matches follow the rules of virtual sumo: a player loses
            when their rikishi (wrestler) is pushed outside the circular dohyo
            (ring). Players are expected to compete in good faith. Deliberate
            disconnection to avoid a loss, match-fixing, or coordinating with
            opponents to inflate rankings are all prohibited and may result in
            account suspension. We reserve the right to adjust rankings when
            manipulation is detected.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold text-black dark:text-zinc-50">
            6. Intellectual Property
          </h2>
          <p className="leading-7 text-zinc-700 dark:text-zinc-300">
            The SumoVerse source code, 3D assets, game logic, and interface
            design are the work of the project team and are shared under the
            terms of the repository&apos;s open-source licence. You may study and
            fork the code for personal or educational purposes in accordance
            with that licence. You may not reproduce or redistribute the game
            commercially without the written consent of the team.
          </p>
          <p className="mt-3 leading-7 text-zinc-700 dark:text-zinc-300">
            Content you create within SumoVerse (such as nicknames and avatar
            images) remains your property. By uploading such content you grant
            us a non-exclusive, royalty-free licence to display it within the
            game and on your public profile.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold text-black dark:text-zinc-50">
            7. Disclaimer of Warranties
          </h2>
          <p className="leading-7 text-zinc-700 dark:text-zinc-300">
            SumoVerse is provided <strong>&quot;as is&quot;</strong> and{" "}
            <strong>&quot;as available&quot;</strong> without warranties of any kind,
            express or implied. As a student project, the service may experience
            downtime, data loss, or unexpected behaviour. We do not guarantee
            that the service will be error-free, uninterrupted, or that defects
            will be corrected.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold text-black dark:text-zinc-50">
            8. Limitation of Liability
          </h2>
          <p className="leading-7 text-zinc-700 dark:text-zinc-300">
            To the maximum extent permitted by applicable law, the SumoVerse
            team shall not be liable for any indirect, incidental, special, or
            consequential damages arising from your use of or inability to use
            the service. Our total liability for any claim relating to the
            service is limited to zero, as SumoVerse is a free, non-commercial
            student project.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold text-black dark:text-zinc-50">
            9. Privacy
          </h2>
          <p className="leading-7 text-zinc-700 dark:text-zinc-300">
            Your use of SumoVerse is also governed by our{" "}
            <Link
              href="/privacy-policy"
              className="font-medium text-zinc-900 underline underline-offset-2 hover:text-black dark:text-zinc-100 dark:hover:text-white"
            >
              Privacy Policy
            </Link>
            , which is incorporated into these Terms by reference. By using the
            service you consent to the data practices described in the Privacy
            Policy.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold text-black dark:text-zinc-50">
            10. Modifications to the Service
          </h2>
          <p className="leading-7 text-zinc-700 dark:text-zinc-300">
            We reserve the right to modify, suspend, or discontinue SumoVerse
            at any time without notice. This is particularly likely at the
            conclusion of the academic year or after project evaluation. We are
            not liable to you or any third party for any such modification,
            suspension, or discontinuation.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold text-black dark:text-zinc-50">
            11. Changes to These Terms
          </h2>
          <p className="leading-7 text-zinc-700 dark:text-zinc-300">
            We may revise these Terms of Service from time to time. Changes will
            be announced via a commit to the{" "}
            <a
              href="https://github.com/42-group-projects/ft_transcendence"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-zinc-900 underline underline-offset-2 hover:text-black dark:text-zinc-100 dark:hover:text-white"
            >
              GitHub repository
            </a>{" "}
            and the effective date at the top of this page will be updated.
            Continued use of SumoVerse after changes are posted constitutes
            acceptance of the revised Terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold text-black dark:text-zinc-50">
            12. Contact
          </h2>
          <p className="leading-7 text-zinc-700 dark:text-zinc-300">
            Questions about these Terms can be raised by opening an issue in the
            project&apos;s{" "}
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
