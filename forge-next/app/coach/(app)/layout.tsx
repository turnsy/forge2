import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth/session";

export default async function CoachAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireRole("coach");

  return (
    <AppShell role="coach" fullName={user.fullName} email={user.email}>
      {children}
    </AppShell>
  );
}
