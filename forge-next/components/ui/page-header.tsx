"use client";

import {
  MobileHeaderContent,
  useMobileAppHeader,
  useIsPageChrome,
} from "./mobile-app-header";
import type { ReactNode } from "react";
import { pageHeaderDescriptionClass, pageHeaderTitleClass } from "@/lib/theme";

export function PageHeader({
  title,
  titleAddon,
  description,
  actions,
}: {
  title: string;
  titleAddon?: ReactNode;
  description?: string;
  actions?: ReactNode;
}) {
  const mobileHeader = useMobileAppHeader();
  const isPageChrome = useIsPageChrome();
  const mobile = mobileHeader && isPageChrome;
  return (
    <>
      {mobile ? (
        <MobileHeaderContent priority="page" title={title} actions={actions} />
      ) : null}
      {!mobile ? (
        <header className="space-y-1" data-page-header>
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <h1 className={pageHeaderTitleClass()}>{title}</h1>
              {titleAddon}
            </div>
            {actions ? (
              <div className="flex shrink-0 items-center gap-2">{actions}</div>
            ) : null}
          </div>
          {description ? (
            <p className={pageHeaderDescriptionClass()}>{description}</p>
          ) : null}
        </header>
      ) : null}
      {mobile && (description || titleAddon) ? (
        <div className="py-2 md:hidden">
          {titleAddon}
          {description ? (
            <p className={pageHeaderDescriptionClass()}>{description}</p>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
