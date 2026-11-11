export const THEME_STORAGE_KEY = "forge.appearance.v1";
export type Appearance = "system" | "light" | "dark";

export function parseAppearance(value: string | null): Appearance {
  return value === "light" || value === "dark" ? value : "system";
}

export function resolveAppearance(
  appearance: Appearance,
  prefersDark: boolean,
) {
  return appearance === "system"
    ? prefersDark
      ? "dark"
      : "light"
    : appearance;
}

// Runs before paint. Keep the storage key and accepted values aligned with the helpers above.
export const appearanceScript = `(function(){try{var p=localStorage.getItem('${THEME_STORAGE_KEY}');document.documentElement.dataset.theme=p==='light'||p==='dark'?p:matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}catch(e){document.documentElement.dataset.theme=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}})()`;
