"use client";

import { useEffect, useState } from "react";
import {
  parseAppearance,
  resolveAppearance,
  THEME_STORAGE_KEY,
  type Appearance,
} from "@/lib/theme/appearance";

export function AppearanceSelect({ compact = false }: { compact?: boolean }) {
  const [appearance, setAppearance] = useState<Appearance>("system");

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    let preference: Appearance = "system";
    try {
      preference = parseAppearance(localStorage.getItem(THEME_STORAGE_KEY));
    } catch {
      /* Private browsing may disable storage. */
    }
    const apply = () => {
      document.documentElement.dataset.theme = resolveAppearance(
        preference,
        media.matches,
      );
      setAppearance(preference);
    };
    const sync = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY || event.key === null) {
        preference = parseAppearance(event.newValue);
        apply();
      }
    };
    const change = (event: Event) => {
      preference = (event as CustomEvent<Appearance>).detail;
      apply();
    };
    apply();
    media.addEventListener("change", apply);
    window.addEventListener("storage", sync);
    window.addEventListener("forge-appearance", change);
    return () => {
      media.removeEventListener("change", apply);
      window.removeEventListener("storage", sync);
      window.removeEventListener("forge-appearance", change);
    };
  }, []);

  return (
    <label
      className={`flex items-center gap-3 text-xs text-surface-muted ${compact ? "justify-center" : "px-1"}`}
    >
      <span className={compact ? "sr-only" : ""}>Appearance</span>
      <select
        aria-label="Appearance"
        className={`min-h-9 min-w-0 rounded-lg border border-glass-border bg-glass px-2 text-xs text-surface-foreground outline-none focus-visible:ring-2 focus-visible:ring-glass-control-border ${compact ? "w-9" : "ml-auto"}`}
        value={appearance}
        onChange={(event) => {
          const next = parseAppearance(event.target.value);
          try {
            localStorage.setItem(THEME_STORAGE_KEY, next);
          } catch {
            /* Keep in-memory preference working. */
          }
          window.dispatchEvent(
            new CustomEvent("forge-appearance", { detail: next }),
          );
        }}
      >
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
  );
}
