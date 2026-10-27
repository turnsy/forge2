"use client";

import type { ReactNode } from "react";
import { MobilePageHeaderScope } from "./mobile-app-header";
import { OverlayScrollChrome } from "@/components/ui/overlay-scroll-chrome";
import { usePageBack } from "@/components/ui/page-back-context";
import type { PageBackConfig } from "@/components/ui/page-back-gutter";
import { PageBackLink } from "@/components/ui/page-back-link";
import {
  hasOverlayScrollLane,
  OVERLAY_SCROLL_LANE_CLASS,
  overlayScrollLaneStyle,
} from "@/lib/layout/overlay-scroll-lane";
import { OVERLAY_TOP_CHROME_HEADER_STACK_CLASS } from "@/lib/layout/overlay-scroll-chrome-layout";
import {
  PAGE_CONTENT_INSET_BOTTOM_CLASS,
  PAGE_CONTENT_INSET_X_CLASS,
} from "@/lib/layout/page-layout";

function buildTopChrome({
  back,
  header,
  subHeader,
}: {
  back?: PageBackConfig;
  header?: ReactNode;
  subHeader?: ReactNode;
}): ReactNode | undefined {
  if (!back && !header && !subHeader) {
    return undefined;
  }

  if (!header && !subHeader) {
    return back ? (
      <div className={"hidden md:block"}>
        <PageBackLink
          href={back.href}
          ariaLabel={back.ariaLabel}
          onClick={back.onClick}
        />
      </div>
    ) : undefined;
  }

  return (
    <div className={`max-md:gap-0 ${OVERLAY_TOP_CHROME_HEADER_STACK_CLASS}`}>
      {header || back ? (
        <div className="max-md:contents md:flex md:items-start md:gap-2">
          {back ? (
            <div className={"hidden shrink-0 md:block"}>
              <PageBackLink
                href={back.href}
                ariaLabel={back.ariaLabel}
                onClick={back.onClick}
              />
            </div>
          ) : null}
          {header ? (
            <div className="max-md:contents md:min-w-0 md:flex-1">
              <MobilePageHeaderScope value={true}>
                {header}
              </MobilePageHeaderScope>
            </div>
          ) : null}
        </div>
      ) : null}
      {subHeader ? <div className="py-3 md:py-0">{subHeader}</div> : null}
    </div>
  );
}

export function ScrollPage({
  header,
  subHeader,
  preFooter,
  footer,
  children,
  className = "",
  contentClassName = PAGE_CONTENT_INSET_X_CLASS,
  footerInsetClassName,
  scrollClassName = "",
  back: backProp,
}: {
  header?: ReactNode;
  /** When using tabs with a page back link, pass TabList here so tabs align with body content. */
  subHeader?: ReactNode;
  preFooter?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  footerInsetClassName?: string;
  scrollClassName?: string;
  back?: PageBackConfig;
}) {
  const { back: contextBack } = usePageBack();
  const back = backProp ?? contextBack;
  const topChrome = buildTopChrome({ back, header, subHeader });
  const resolvedFooterInset =
    footerInsetClassName ?? PAGE_CONTENT_INSET_BOTTOM_CLASS;

  return (
    <div
      className={`relative flex min-h-0 flex-1 flex-col overflow-hidden${className ? ` ${className}` : ""}`}
    >
      <OverlayScrollChrome
        topChrome={topChrome}
        topChromeClassName="max-md:pt-0 max-md:pb-0"
        preFooter={preFooter}
        footer={footer}
        footerInsetClassName={resolvedFooterInset}
        contentInsetClassName={contentClassName}
      >
        {({ scrollPaddingTop, scrollPaddingBottom }) => {
          const lanePadding = { scrollPaddingTop, scrollPaddingBottom };
          const lanePositioned = hasOverlayScrollLane(lanePadding);

          return (
            <div
              className={`${lanePositioned ? OVERLAY_SCROLL_LANE_CLASS : "absolute inset-0 z-0 overflow-y-auto"} ${contentClassName}${scrollClassName ? ` ${scrollClassName}` : ""}`}
              style={
                lanePositioned ? overlayScrollLaneStyle(lanePadding) : undefined
              }
            >
              {children}
            </div>
          );
        }}
      </OverlayScrollChrome>
    </div>
  );
}
