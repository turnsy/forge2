"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { PageBackConfig } from "@/components/ui/page-back-gutter";

type PageBackContextValue = {
  back?: PageBackConfig;
};

const PageBackContext = createContext<PageBackContextValue>({});

export function PageBackProvider({
  back,
  children,
}: {
  back?: PageBackConfig;
  children: ReactNode;
}) {
  return (
    <PageBackContext.Provider value={{ back }}>
      {children}
    </PageBackContext.Provider>
  );
}

export function usePageBack(): PageBackContextValue {
  return useContext(PageBackContext);
}
