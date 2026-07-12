"use client";

import type { ReactNode } from "react";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";
import { useMeasuredHeight } from "@/lib/hooks/use-measured-height";
import { PAGE_CONTENT_INSET_BOTTOM_CLASS } from "@/lib/layout/page-layout";
import {
  OVERLAY_BOTTOM_BLUR_ZONE_CLASS,
  OVERLAY_FOOTER_CLASS,
  OVERLAY_PRE_FOOTER_CLASS,
  OVERLAY_SCROLL_END_GAP_PX,
  OVERLAY_TOP_CHROME_CLASS,
  OVERLAY_TOP_CONTAINER_CLASS,
} from "@/lib/layout/overlay-scroll-chrome-layout";

export type OverlayScrollPadding = {
  scrollPaddingTop?: number;
  scrollPaddingBottom?: number;
};

function insetContentClassName(contentInsetClassName: string): string {
  return contentInsetClassName ? ` ${contentInsetClassName}` : "";
}

export function OverlayScrollChrome({
  topChrome,
  topContainerClassName = "",
  preFooter,
  footer,
  footerInsetClassName = "",
  contentInsetClassName = "",
  children,
}: {
  topChrome?: ReactNode;
  topContainerClassName?: string;
  preFooter?: ReactNode;
  footer?: ReactNode;
  footerInsetClassName?: string;
  contentInsetClassName?: string;
  children: (padding: OverlayScrollPadding) => ReactNode;
}) {
  const { ref: footerRef, height: footerHeight } = useMeasuredHeight<HTMLDivElement>();
  const { ref: topChromeRef, height: topChromeHeight } =
    useMeasuredHeight<HTMLDivElement>();

  const scrollPaddingTop =
    topChrome && topChromeHeight > 0
      ? topChromeHeight + OVERLAY_SCROLL_END_GAP_PX
      : undefined;
  const scrollPaddingBottom =
    footerHeight > 0 ? footerHeight + OVERLAY_SCROLL_END_GAP_PX : undefined;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      {children({ scrollPaddingTop, scrollPaddingBottom })}
      {topChrome ? (
        <div
          className={`${OVERLAY_TOP_CONTAINER_CLASS}${topContainerClassName ? ` ${topContainerClassName}` : ""}`}
        >
          <div ref={topChromeRef} className={OVERLAY_TOP_CHROME_CLASS}>
            <ProgressiveBlur
              direction="top"
              className="pointer-events-none absolute inset-0 z-0"
            />
            <div className={`relative z-10${insetContentClassName(contentInsetClassName)}`}>
              {topChrome}
            </div>
          </div>
        </div>
      ) : null}
      <div ref={footerRef} className={OVERLAY_FOOTER_CLASS}>
        <div
          className={`${OVERLAY_BOTTOM_BLUR_ZONE_CLASS}${footerInsetClassName ? ` ${footerInsetClassName}` : ""}`}
        >
          <ProgressiveBlur
            direction="bottom"
            className="pointer-events-none absolute inset-0 z-0"
          />
          {preFooter ? (
            <div className={`${OVERLAY_PRE_FOOTER_CLASS}${insetContentClassName(contentInsetClassName)}`}>
              {preFooter}
            </div>
          ) : null}
          {footer ? (
            <div
              className={`relative z-10 pointer-events-auto${insetContentClassName(contentInsetClassName)}${footerInsetClassName ? "" : insetContentClassName(PAGE_CONTENT_INSET_BOTTOM_CLASS)}`}
            >
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
