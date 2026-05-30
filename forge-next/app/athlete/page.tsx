import { SignOutButton } from "@/components/auth/sign-out-button";
import { requireRole } from "@/lib/auth/session";

export default async function AthletePage() {
  const user = await requireRole("athlete");

  return (
    <main className="mx-auto flex min-h-full max-w-3xl flex-col gap-6 p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Athlete</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Signed in as {user.fullName ?? user.email ?? user.id}
          </p>
        </div>
        <SignOutButton />
      </div>
    </main>
  );
}
