import type { MouseEvent, ReactNode } from "react";
import { PageBackLink } from "@/components/ui/page-back-link";
import { pageBackGutterGapClass } from "@/lib/theme";

export type PageBackConfig = {
  href: string;
  ariaLabel: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
};

export function PageBackGutter({
  back,
  children,
  className,
  contentClassName,
  gutterClassName = pageBackGutterGapClass(),
}: {
  back: PageBackConfig;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  gutterClassName?: string;
}) {
  return (
    <div
      className={`grid grid-cols-[auto_minmax(0,1fr)] items-start ${gutterClassName}${className ? ` ${className}` : ""}`}
    >
      <div className="flex h-8 items-center justify-end">
        <PageBackLink
          href={back.href}
          ariaLabel={back.ariaLabel}
          onClick={back.onClick}
        />
      </div>
      <div className={`min-w-0${contentClassName ? ` ${contentClassName}` : ""}`}>
        {children}
      </div>
    </div>
  );
}
