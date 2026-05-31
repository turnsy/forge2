import type { ReactNode } from "react";
import { pageContentClass } from "@/lib/theme";

export function PageContent({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <main className={`${pageContentClass()}${className ? ` ${className}` : ""}`}>
      {children}
    </main>
  );
}
