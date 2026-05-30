import Link from "next/link";
import { notFound } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";
import { isUserRole } from "@/lib/auth/redirects";

export default async function SignupRolePage({
  params,
}: Readonly<{
  params: Promise<{ role: string }>;
}>) {
  const { role: roleParam } = await params;

  if (!isUserRole(roleParam)) {
    notFound();
  }

  const label = roleParam === "coach" ? "Coach" : "Athlete";

  return (
    <AuthShell
      title={`Sign up as ${label}`}
      description="Your role is set by this signup route."
      footer={
        <Link href="/auth/signup" className="font-medium text-zinc-900 dark:text-zinc-100">
          Choose a different role
        </Link>
      }
    >
      <SignupForm role={roleParam} />
    </AuthShell>
  );
}
