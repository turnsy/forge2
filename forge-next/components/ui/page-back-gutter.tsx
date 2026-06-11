import type { MouseEvent, ReactNode } from "react";
import { PageBackLink } from "@/components/ui/page-back-link";
import {
  pageBackGutterAlignClass,
  pageBackGutterOffsetClass,
} from "@/lib/theme";

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
  backAlignClassName = pageBackGutterAlignClass(),
  offsetClassName = pageBackGutterOffsetClass(),
}: {
  back: PageBackConfig;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  backAlignClassName?: string;
  offsetClassName?: string;
}) {
  const backLink = (
    <PageBackLink
      href={back.href}
      ariaLabel={back.ariaLabel}
      onClick={back.onClick}
    />
  );

  return (
    <div className={`relative${className ? ` ${className}` : ""}`}>
      <div
        className={`absolute right-full hidden md:flex ${backAlignClassName} ${offsetClassName}`}
      >
        {backLink}
      </div>
      <div className="flex min-w-0 items-start gap-2 md:block">
        <PageBackLink
          href={back.href}
          ariaLabel={back.ariaLabel}
          onClick={back.onClick}
          className="shrink-0 md:hidden"
        />
        {contentClassName ? (
          <div className={`min-w-0 flex-1 md:w-full ${contentClassName}`}>
            {children}
          </div>
        ) : (
          <div className="min-w-0 flex-1 md:contents">{children}</div>
        )}
      </div>
    </div>
  );
}
