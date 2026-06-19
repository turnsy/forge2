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
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-x-visible overflow-y-auto">
        {children}
      </div>
    </AppShell>
  );
}
