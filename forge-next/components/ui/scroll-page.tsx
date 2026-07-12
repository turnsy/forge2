"use client";

import type { ReactNode } from "react";
import { OverlayScrollChrome } from "@/components/ui/overlay-scroll-chrome";
import { usePageBack } from "@/components/ui/page-back-context";
import type { PageBackConfig } from "@/components/ui/page-back-gutter";
import { PageBackLink } from "@/components/ui/page-back-link";
import { useIsMobile } from "@/lib/hooks/use-is-mobile";
import {
  hasOverlayScrollLane,
  OVERLAY_SCROLL_LANE_CLASS,
  overlayScrollLaneStyle,
} from "@/lib/layout/overlay-scroll-lane";
import {
  OVERLAY_TOP_CHROME_HEADER_STACK_CLASS,
} from "@/lib/layout/overlay-scroll-chrome-layout";
import {
  PAGE_CONTENT_INSET_BOTTOM_CLASS,
  PAGE_CONTENT_INSET_X_CLASS,
} from "@/lib/layout/page-layout";
import { MOBILE_ONLY_BOTTOM_NAV_OFFSET_CLASS } from "@/lib/navigation/mobile-bottom-nav-layout";

function buildTopChrome({
  back,
  showMobileBack,
  header,
}: {
  back?: PageBackConfig;
  showMobileBack: boolean;
  header?: ReactNode;
}): ReactNode | undefined {
  if (!back && !header) {
    return undefined;
  }

  if (!header) {
    return back ? (
      <div className={showMobileBack ? undefined : "hidden md:block"}>
        <PageBackLink
          href={back.href}
          ariaLabel={back.ariaLabel}
          onClick={back.onClick}
        />
      </div>
    ) : undefined;
  }

  return (
    <div className="flex items-start gap-2">
      {back ? (
        <div className={showMobileBack ? "shrink-0" : "hidden shrink-0 md:block"}>
          <PageBackLink
            href={back.href}
            ariaLabel={back.ariaLabel}
            onClick={back.onClick}
          />
        </div>
      ) : null}
      <div className={`min-w-0 flex-1 ${OVERLAY_TOP_CHROME_HEADER_STACK_CLASS}`}>{header}</div>
    </div>
  );
}

export function ScrollPage({
  header,
  preFooter,
  footer,
  children,
  className = "",
  contentClassName = PAGE_CONTENT_INSET_X_CLASS,
  footerInsetClassName,
  scrollClassName = "",
  back: backProp,
  showMobileBack: showMobileBackProp,
}: {
  header?: ReactNode;
  preFooter?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  footerInsetClassName?: string;
  scrollClassName?: string;
  back?: PageBackConfig;
  showMobileBack?: boolean;
}) {
  const isMobile = useIsMobile();
  const { back: contextBack, showMobileBack: contextShowMobileBack } = usePageBack();
  const back = backProp ?? contextBack;
  const showMobileBack = showMobileBackProp ?? contextShowMobileBack;
  const topChrome = buildTopChrome({ back, showMobileBack, header });
  const resolvedFooterInset =
    footerInsetClassName ??
    (isMobile ? MOBILE_ONLY_BOTTOM_NAV_OFFSET_CLASS : PAGE_CONTENT_INSET_BOTTOM_CLASS);

  return (
    <div
      className={`relative flex min-h-0 flex-1 flex-col overflow-hidden${className ? ` ${className}` : ""}`}
    >
      <OverlayScrollChrome
        topChrome={topChrome}
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
            style={lanePositioned ? overlayScrollLaneStyle(lanePadding) : undefined}
          >
            {children}
          </div>
          );
        }}
      </OverlayScrollChrome>
    </div>
  );
}
