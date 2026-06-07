import type { ReactNode } from "react";
import { PageBackGutter, type PageBackConfig } from "@/components/ui/page-back-gutter";
import { pageContentClass, pageShellClass } from "@/lib/theme";

export function PageShell({
  back,
  className,
  children,
}: {
  back?: PageBackConfig;
  className?: string;
  children: ReactNode;
}) {
  if (!back) {
    return (
      <main className={`${pageContentClass()}${className ? ` ${className}` : ""}`}>
        {children}
      </main>
    );
  }

  return (
    <div className={`${pageShellClass()}${className ? ` ${className}` : ""}`}>
      <PageBackGutter back={back}>
        <main className="flex min-h-full flex-col gap-6">{children}</main>
      </PageBackGutter>
    </div>
  );
}
