import Link from "next/link";

export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-6 text-neutral-100 sm:px-6 lg:px-8">
          <p className="text-sm uppercase tracking-[0.3em] text-neutral-500">Profile</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Profile Placeholder</h1>
          <p className="mt-4 text-neutral-300">
            This is a temporary profile page. We can connect avatar updates and user data to the backend later.
          </p>

          {/* TODO: Replace mock content with backend-powered profile details and edit actions. */}

          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              href="/lobby"
              className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              Back to Lobby
            </Link>
          </div>
    </main>
  );
}