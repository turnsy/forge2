import { CoachAppShell } from "@/components/coach/coach-app-shell";
import { requireRole } from "@/lib/auth/session";

export default async function CoachAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireRole("coach");

  return <CoachAppShell>{children}</CoachAppShell>;
}
