"use client";

import type { ReactNode } from "react";
import { OverlayScrollChrome } from "@/components/ui/overlay-scroll-chrome";
import { useIsMobile } from "@/lib/hooks/use-is-mobile";
import {
  PAGE_CONTENT_INSET_BOTTOM_CLASS,
  PAGE_CONTENT_INSET_X_CLASS,
} from "@/lib/layout/page-layout";
import { MOBILE_ONLY_BOTTOM_NAV_OFFSET_CLASS } from "@/lib/navigation/mobile-bottom-nav-layout";

export function ScrollPage({
  header,
  preFooter,
  footer,
  children,
  className = "",
  contentClassName = PAGE_CONTENT_INSET_X_CLASS,
  footerInsetClassName,
  scrollClassName = "",
}: {
  header?: ReactNode;
  preFooter?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  footerInsetClassName?: string;
  scrollClassName?: string;
}) {
  const isMobile = useIsMobile();
  const resolvedFooterInset =
    footerInsetClassName ??
    (isMobile ? MOBILE_ONLY_BOTTOM_NAV_OFFSET_CLASS : PAGE_CONTENT_INSET_BOTTOM_CLASS);

  return (
    <div
      className={`relative flex min-h-0 flex-1 flex-col overflow-hidden${className ? ` ${className}` : ""}`}
    >
      <OverlayScrollChrome
        topChrome={header}
        preFooter={preFooter}
        footer={footer}
        footerInsetClassName={resolvedFooterInset}
        contentInsetClassName={contentClassName}
      >
        {({ scrollPaddingTop, scrollPaddingBottom }) => (
          <div
            className={`absolute inset-0 z-0 overflow-y-auto ${contentClassName}${scrollClassName ? ` ${scrollClassName}` : ""}`}
            style={{
              ...(scrollPaddingTop !== undefined
                ? { paddingTop: scrollPaddingTop }
                : {}),
              ...(scrollPaddingBottom !== undefined
                ? { paddingBottom: scrollPaddingBottom }
                : {}),
            }}
          >
            {children}
          </div>
        )}
      </OverlayScrollChrome>
    </div>
  );
}
