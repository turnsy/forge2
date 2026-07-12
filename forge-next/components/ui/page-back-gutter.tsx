import type { MouseEvent, ReactNode } from "react";
import { PageBackLink } from "@/components/ui/page-back-link";
import { pageBackGutterAlignClass } from "@/lib/theme";

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
  showMobileBack = true,
}: {
  back: PageBackConfig;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  backAlignClassName?: string;
  showMobileBack?: boolean;
}) {
  const reserveHeaderSpace = showMobileBack
    ? " [&_[data-page-header]]:pl-12"
    : " [&_[data-page-header]]:md:pl-12";

  return (
    <div
      data-page-back-gutter
      className={`relative${reserveHeaderSpace}${className ? ` ${className}` : ""}`}
    >
      {contentClassName ? (
        <div className={`relative z-0 ${contentClassName}`}>{children}</div>
      ) : (
        <div className="relative z-0">{children}</div>
      )}
      {showMobileBack ? (
        <div
          className={`pointer-events-auto absolute left-0 top-0 z-30 md:hidden ${backAlignClassName}`}
        >
          <PageBackLink
            href={back.href}
            ariaLabel={back.ariaLabel}
            onClick={back.onClick}
          />
        </div>
      ) : null}
      <div
        className={`pointer-events-auto absolute left-0 top-0 z-30 hidden md:flex ${backAlignClassName}`}
      >
        <PageBackLink
          href={back.href}
          ariaLabel={back.ariaLabel}
          onClick={back.onClick}
        />
      </div>
    </div>
  );
}
