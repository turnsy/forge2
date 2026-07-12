import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function AthleteAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireRole("athlete");

  return (
    <AppShell role="athlete" fullName={user.fullName} email={user.email}>
      <div className="flex min-h-0 flex-1 flex-col overflow-x-visible overflow-y-hidden">
        {children}
      </div>
    </AppShell>
  );
}
