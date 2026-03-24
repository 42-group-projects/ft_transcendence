import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-10 text-neutral-100 sm:px-6">
      <section className="mx-auto w-full max-w-3xl">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.3em] text-neutral-500">Legal</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Terms of Service(Placeholder)</h1>
          <p className="mt-2 text-sm text-neutral-400">Last updated: March 2026</p>
        </div>


        <div className="mt-6 flex items-center gap-4 text-sm text-neutral-400">
          <Link href="/privacy" className="transition hover:text-neutral-100">Privacy Policy</Link>
          <span className="text-neutral-700">|</span>
          <Link href="/" className="transition hover:text-neutral-100">Back home</Link>
        </div>
      </section>
    </main>
  );
}
