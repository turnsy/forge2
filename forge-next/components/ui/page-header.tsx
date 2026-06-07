import type { MouseEvent, ReactNode } from "react";
import { PageBackLink } from "@/components/ui/page-back-link";

export function PageHeader({
  title,
  titleAddon,
  description,
  back,
  actions,
}: {
  title: string;
  titleAddon?: ReactNode;
  description?: string;
  back?: {
    href: string;
    ariaLabel: string;
    onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
  };
  actions?: ReactNode;
}) {
  return (
    <header className="space-y-1">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2">
          {back ? (
            <PageBackLink
              href={back.href}
              ariaLabel={back.ariaLabel}
              onClick={back.onClick}
            />
          ) : null}
          <div className="flex min-w-0 items-center gap-3">
            <h1 className="truncate text-2xl font-semibold text-surface-foreground">
              {title}
            </h1>
            {titleAddon}
          </div>
        </div>
        {actions ? (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        ) : null}
      </div>
      {description ? (
        <p className="text-sm text-surface-muted">{description}</p>
      ) : null}
    </header>
  );
}
