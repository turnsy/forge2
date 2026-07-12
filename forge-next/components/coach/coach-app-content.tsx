"use client";

import type { ReactNode } from "react";

export function CoachAppContent({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-x-visible overflow-y-hidden">
      {children}
    </div>
  );
}
