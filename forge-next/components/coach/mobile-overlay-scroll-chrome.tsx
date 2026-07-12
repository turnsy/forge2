"use client";

import type { ReactNode } from "react";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";
import { useMeasuredHeight } from "@/lib/hooks/use-measured-height";
import {
  MOBILE_CHAT_BOTTOM_BLUR_ZONE_CLASS,
  MOBILE_CHAT_CONTENT_INSET_X_CLASS,
  MOBILE_CHAT_FOOTER_CLASS,
  MOBILE_CHAT_SCROLL_END_GAP_PX,
  MOBILE_CHAT_TOP_CHROME_CLASS,
  MOBILE_CHAT_TOP_OVERLAY_CLASS,
  MOBILE_COMPOSER_TOOLBAR_FOOTER_CLASS,
} from "@/lib/coach/mobile-workspace-layout";

export type MobileOverlayScrollPadding = {
  scrollPaddingTop?: number;
  scrollPaddingBottom?: number;
};

export function MobileOverlayScrollChrome({
  topChrome,
  topContainerClassName = "",
  preFooter,
  footer,
  footerInsetClassName = "",
  contentInsetClassName = MOBILE_CHAT_CONTENT_INSET_X_CLASS,
  children,
}: {
  topChrome?: ReactNode;
  topContainerClassName?: string;
  preFooter?: ReactNode;
  footer?: ReactNode;
  footerInsetClassName?: string;
  contentInsetClassName?: string;
  children: (padding: MobileOverlayScrollPadding) => ReactNode;
}) {
  const { ref: footerRef, height: footerHeight } = useMeasuredHeight<HTMLDivElement>();
  const { ref: topChromeRef, height: topChromeHeight } =
    useMeasuredHeight<HTMLDivElement>();

  const scrollPaddingTop =
    topChrome && topChromeHeight > 0
      ? topChromeHeight + MOBILE_CHAT_SCROLL_END_GAP_PX
      : undefined;
  const scrollPaddingBottom =
    footerHeight > 0 ? footerHeight + MOBILE_CHAT_SCROLL_END_GAP_PX : undefined;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      {children({ scrollPaddingTop, scrollPaddingBottom })}
      {topChrome ? (
        <div
          className={`${MOBILE_CHAT_TOP_OVERLAY_CLASS}${topContainerClassName ? ` ${topContainerClassName}` : ""}`}
        >
          <div
            ref={topChromeRef}
            className={`${MOBILE_CHAT_TOP_CHROME_CLASS} ${contentInsetClassName}`}
          >
            <ProgressiveBlur
              direction="top"
              className="pointer-events-none absolute inset-0 z-0"
            />
            <div className="relative z-10">{topChrome}</div>
          </div>
        </div>
      ) : null}
      <div ref={footerRef} className={MOBILE_CHAT_FOOTER_CLASS}>
        {preFooter ? (
          <div
            className={`${MOBILE_COMPOSER_TOOLBAR_FOOTER_CLASS} ${contentInsetClassName}`}
          >
            {preFooter}
          </div>
        ) : null}
        <div
          className={`${MOBILE_CHAT_BOTTOM_BLUR_ZONE_CLASS}${footerInsetClassName ? ` ${footerInsetClassName}` : ""}`}
        >
          <ProgressiveBlur
            direction="bottom"
            className="pointer-events-none absolute inset-0 z-0"
          />
          {footer ? (
            <div className={`relative z-10 pointer-events-auto ${contentInsetClassName}`}>
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
