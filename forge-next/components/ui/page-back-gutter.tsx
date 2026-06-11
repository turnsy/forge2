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
  return (
    <div
      className={`relative [&_[data-page-header]]:max-md:pl-12${className ? ` ${className}` : ""}`}
    >
      <div
        className={`absolute right-full hidden md:flex ${backAlignClassName} ${offsetClassName}`}
      >
        <PageBackLink
          href={back.href}
          ariaLabel={back.ariaLabel}
          onClick={back.onClick}
        />
      </div>
      <div className="absolute left-0 top-0 z-10 md:hidden">
        <PageBackLink
          href={back.href}
          ariaLabel={back.ariaLabel}
          onClick={back.onClick}
        />
      </div>
      {contentClassName ? (
        <div className={contentClassName}>{children}</div>
      ) : (
        children
      )}
    </div>
  );
}
