import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { CoachAppContent } from "@/components/coach/coach-app-content";
import { CoachSessionLoadingView } from "@/components/coach/coach-session-loading-view";
import { requireRole } from "@/lib/auth/session";
import { SessionNavigationProvider } from "@/lib/chat/session-navigation-context";

export const dynamic = "force-dynamic";

export default async function CoachAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireRole("coach");

  return (
    <SessionNavigationProvider>
      <AppShell role="coach" fullName={user.fullName} email={user.email}>
        <Suspense fallback={<CoachSessionLoadingView />}>
          <CoachAppContent>{children}</CoachAppContent>
        </Suspense>
      </AppShell>
    </SessionNavigationProvider>
  );
}
