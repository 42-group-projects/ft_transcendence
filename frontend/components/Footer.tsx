import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-black/[.08] bg-white py-6 dark:border-white/[.1] dark:bg-black">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 px-6 text-sm text-zinc-500 sm:flex-row sm:justify-between dark:text-zinc-400">
        <p>© {currentYear} SumoVerse. All rights reserved.</p>
        <nav className="flex gap-6">
          <Link
            href="/privacy-policy"
            className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms-of-service"
            className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            Terms of Service
          </Link>
        </nav>
      </div>
    </footer>
  );
}
