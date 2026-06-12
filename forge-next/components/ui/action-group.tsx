import type { ReactNode } from "react";

export function ActionGroup({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:flex-wrap md:items-center [&_button]:w-full md:[&_button]:w-auto">
      {children}
    </div>
  );
}
