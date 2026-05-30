import Link from "next/link";
import { signupPathForRole } from "@/lib/auth/signup";

export default function SignupHubPage() {
  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col justify-center gap-6 p-8">
      <h1 className="text-2xl font-semibold">Create an account</h1>
      <p className="text-zinc-600">Choose how you will use Forge.</p>
      <div className="flex flex-col gap-3">
        <Link
          href={signupPathForRole("coach")}
          className="rounded-lg border border-zinc-200 px-4 py-3 text-center font-medium hover:bg-zinc-50"
        >
          Sign up as a coach
        </Link>
        <Link
          href={signupPathForRole("athlete")}
          className="rounded-lg border border-zinc-200 px-4 py-3 text-center font-medium hover:bg-zinc-50"
        >
          Sign up as an athlete
        </Link>
      </div>
    </main>
  );
}
