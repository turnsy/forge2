import type { MouseEvent, ReactNode } from "react";
import { PageBackLink } from "@/components/ui/page-back-link";
import { pageContentClass, pageShellClass } from "@/lib/theme";

export function PageShell({
  back,
  className,
  children,
}: {
  back?: {
    href: string;
    ariaLabel: string;
    onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  };
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
    <div className={`relative ${pageShellClass()}${className ? ` ${className}` : ""}`}>
      <div className="absolute top-8 right-full mr-2 sm:mr-3">
        <PageBackLink
          href={back.href}
          ariaLabel={back.ariaLabel}
          onClick={back.onClick}
        />
      </div>
      <main className="flex min-h-full flex-col gap-6">{children}</main>
    </div>
  );
}
