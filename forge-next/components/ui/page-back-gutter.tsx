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
  showMobileBack = true,
}: {
  back: PageBackConfig;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  backAlignClassName?: string;
  offsetClassName?: string;
  showMobileBack?: boolean;
}) {
  const content = contentClassName ? (
    <div className={contentClassName}>{children}</div>
  ) : (
    children
  );

  return (
    <div
      className={`relative${showMobileBack ? " [&_[data-page-header]]:max-md:pl-12" : ""}${className ? ` ${className}` : ""}`}
    >
      {content}
      <div
        className={`pointer-events-auto absolute right-full z-30 hidden md:flex ${backAlignClassName} ${offsetClassName}`}
      >
        <PageBackLink
          href={back.href}
          ariaLabel={back.ariaLabel}
          onClick={back.onClick}
        />
      </div>
      {showMobileBack ? (
        <div className="pointer-events-auto absolute left-0 top-0 z-30 md:hidden">
          <PageBackLink
            href={back.href}
            ariaLabel={back.ariaLabel}
            onClick={back.onClick}
          />
        </div>
      ) : null}
    </div>
  );
}
