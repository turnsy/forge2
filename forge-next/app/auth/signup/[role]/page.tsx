import { notFound } from "next/navigation";
import { isUserRole } from "@/lib/auth/redirects";

export default async function SignupRolePage({
  params,
}: Readonly<{
  params: Promise<{ role: string }>;
}>) {
  const { role } = await params;

  if (!isUserRole(role)) {
    notFound();
  }

  const label = role === "coach" ? "Coach" : "Athlete";

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold">Sign up as {label}</h1>
      <p className="text-zinc-600">
        Signup form UI will live here. Role is fixed by this route and stored
        server-side for the auth flow.
      </p>
    </main>
  );
}
