import { AppShell } from "@/components/app-shell";
import { CoachRouteTransition } from "@/components/coach/coach-route-transition";
import { requireRole } from "@/lib/auth/session";

export default async function CoachAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireRole("coach");

  return (
    <AppShell role="coach" fullName={user.fullName} email={user.email}>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <CoachRouteTransition>{children}</CoachRouteTransition>
      </div>
    </AppShell>
  );
}
