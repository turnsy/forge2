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
  const content = contentClassName ? (
    <div className={contentClassName}>{children}</div>
  ) : (
    children
  );

  return (
    <div
      className={`relative${className ? ` ${className}` : ""}`}
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
    </div>
  );
}
