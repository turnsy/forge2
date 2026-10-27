"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { ForgeLogo } from "@/components/forge-logo";
import { ProgressiveBlur } from "./progressive-blur";

// Used by both the sidebar toggle and every mobile header action.
export const MOBILE_HEADER_BUTTON_CLASS = "mobile-header-button";

const MobileHeaderContext = createContext<{
  navigation: HTMLDivElement | null;
  title: HTMLDivElement | null;
  actions: HTMLDivElement | null;
  setNavigation: (node: HTMLDivElement | null) => void;
  setTitle: (node: HTMLDivElement | null) => void;
  setActions: (node: HTMLDivElement | null) => void;
} | null>(null);
const PageHeaderScope = createContext(false);
export const MobilePageHeaderScope = PageHeaderScope.Provider;
export function useMobileAppHeader() {
  return useContext(MobileHeaderContext);
}
export function useIsPageChrome() {
  return useContext(PageHeaderScope);
}

function defaultTitle(pathname: string) {
  const section = pathname.split("/")[2];
  return (
    (
      {
        plans: "Plans",
        athletes: "Athletes",
        exercises: "Exercises",
        maxes: "Maxes",
        history: "History",
        settings: "Settings",
      } as Record<string, string>
    )[section] ?? (pathname.startsWith("/coach") ? "Forge" : "Workout")
  );
}

/** Keep the provider mounted across breakpoints so page state survives resizing. */
export function MobileAppHeaderProvider({
  children,
  enabled = true,
}: {
  children: ReactNode;
  enabled?: boolean;
}) {
  const [navigation, setNavigation] = useState<HTMLDivElement | null>(null);
  const [title, setTitle] = useState<HTMLDivElement | null>(null);
  const [actions, setActions] = useState<HTMLDivElement | null>(null);
  return (
    <MobileHeaderContext.Provider
      value={
        enabled
          ? { navigation, title, actions, setNavigation, setTitle, setActions }
          : null
      }
    >
      {children}
    </MobileHeaderContext.Provider>
  );
}

/** A single compact row on every authenticated mobile route, including empty/error states. */
export function MobileAppHeader() {
  const header = useMobileAppHeader();
  const pathname = usePathname();
  if (!header) return null;
  const { setNavigation, setTitle, setActions } = header;
  return (
    <div className="relative z-30 shrink-0 md:hidden" data-mobile-app-header>
      <ProgressiveBlur
        direction="top"
        className="absolute inset-x-0 top-0 -bottom-3"
      />
      <div className="relative grid grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center gap-3 px-4 py-2">
        <div ref={setNavigation} />
        <div
          ref={setTitle}
          className="mobile-header-title mobile-header-slot min-w-0 text-center"
        >
          <h1
            data-mobile-fallback
            className="flex justify-center truncate text-base font-semibold leading-tight"
          >
            {pathname === "/coach" || pathname === "/athlete" ? (
              <ForgeLogo variant="mark" size="sidebar" />
            ) : defaultTitle(pathname)}
          </h1>
        </div>
        <div
          ref={setActions}
          className="mobile-header-slot flex h-11 w-11 items-center justify-center"
        />
      </div>
    </div>
  );
}

/** Nested views can replace the title/action without adding another header row. */
export function MobileHeaderContent({
  title,
  actions,
  priority = "view",
}: {
  title?: string;
  actions?: ReactNode;
  priority?: "page" | "view";
}) {
  const header = useMobileAppHeader();
  if (!header) return null;
  return (
    <>
      {header.title && title
        ? createPortal(
            <h1
              data-mobile-title
              data-mobile-priority={priority}
              title={title}
              className="truncate text-base font-semibold leading-tight"
            >
              {title}
            </h1>,
            header.title,
          )
        : null}
      {header.actions
        ? createPortal(
            <div
              className="mobile-header-actions"
              data-mobile-priority={priority}
            >
              {actions}
            </div>,
            header.actions,
          )
        : null}
    </>
  );
}
