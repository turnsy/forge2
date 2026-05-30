import type { ReactNode } from "react";
import { CoachSidebar } from "@/components/coach/coach-sidebar";

export function CoachAppShell({ children }: { children: ReactNode }) {
  return (
    <div className="dark flex min-h-screen bg-background text-foreground">
      <CoachSidebar />
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
