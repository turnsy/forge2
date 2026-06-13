"use client";

import {
  createContext,
  useContext,
  useId,
  useState,
  type ReactNode,
} from "react";

type TabsContextValue = {
  activeTab: string;
  setActiveTab: (id: string) => void;
  baseId: string;
};

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext(): TabsContextValue {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error("Tabs components must be used within Tabs");
  }
  return context;
}

export function Tabs({
  defaultTab,
  children,
}: {
  defaultTab: string;
  children: ReactNode;
}) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const baseId = useId();

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab, baseId }}>
      {children}
    </TabsContext.Provider>
  );
}

export function TabList({ children }: { children: ReactNode }) {
  return (
    <div
      role="tablist"
      className="-mx-1 flex gap-1 overflow-x-auto border-b border-glass-border px-1 pb-px"
    >
      {children}
    </div>
  );
}

export function Tab({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  const { activeTab, setActiveTab, baseId } = useTabsContext();
  const selected = activeTab === id;

  return (
    <button
      type="button"
      role="tab"
      id={`${baseId}-tab-${id}`}
      aria-selected={selected}
      aria-controls={`${baseId}-panel-${id}`}
      tabIndex={selected ? 0 : -1}
      onClick={() => setActiveTab(id)}
      className={`shrink-0 border-b-2 px-3 py-2 text-sm font-medium transition ${
        selected
          ? "border-surface-foreground text-surface-foreground"
          : "border-transparent text-surface-muted hover:border-glass-border hover:text-surface-foreground"
      }`}
    >
      {children}
    </button>
  );
}

export function TabPanel({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  const { activeTab, baseId } = useTabsContext();

  if (activeTab !== id) {
    return null;
  }

  return (
    <div
      role="tabpanel"
      id={`${baseId}-panel-${id}`}
      aria-labelledby={`${baseId}-tab-${id}`}
      className="pt-6"
    >
      {children}
    </div>
  );
}
