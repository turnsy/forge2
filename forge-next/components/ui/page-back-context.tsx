"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { PageBackConfig } from "@/components/ui/page-back-gutter";

type PageBackContextValue = {
  back?: PageBackConfig;
  showMobileBack: boolean;
};

const PageBackContext = createContext<PageBackContextValue>({
  showMobileBack: true,
});

export function PageBackProvider({
  back,
  showMobileBack = true,
  children,
}: {
  back?: PageBackConfig;
  showMobileBack?: boolean;
  children: ReactNode;
}) {
  return (
    <PageBackContext.Provider value={{ back, showMobileBack }}>
      {children}
    </PageBackContext.Provider>
  );
}

export function usePageBack(): PageBackContextValue {
  return useContext(PageBackContext);
}
