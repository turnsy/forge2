import { focusRingClass } from "@/lib/theme/surfaces";

export const sidebarItemClassName = `flex w-full min-h-9 items-center gap-3 rounded-xl px-4 py-1.5 text-sm font-semibold transition ${focusRingClass}`;

export const sidebarItemInactiveClassName =
  "text-surface-muted hover:bg-glass hover:text-surface-foreground";

export const sidebarItemActiveClassName = "bg-glass text-surface-foreground";
