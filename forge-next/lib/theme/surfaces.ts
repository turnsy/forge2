import type { UserRole } from "@/lib/auth/types";
import { radius, typography } from "@/lib/theme/tokens";
import { roleBorderClass } from "@/lib/theme/roles";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "plain" | "dashed" | "danger";
export type ButtonSize = "sm" | "md";
export type MessageTone = "error" | "success" | "info";
export type PillTone = "default" | "danger";

/** Default md button height. */
export const BUTTON_MD_HEIGHT_CLASS = "h-11";

/** Default sm button height; shared with attachment chips and compact actions. */
export const BUTTON_SM_HEIGHT_CLASS = "h-8";

export const focusRingClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

const plainIconControlClasses = `text-surface-muted transition hover:bg-glass hover:text-surface-foreground ${focusRingClass}`;

const secondaryGlassClass =
  "border border-glass-border bg-glass text-surface-foreground shadow-[inset_0_1px_0_0_var(--color-glass-highlight)] backdrop-blur-md hover:bg-glass-focus";

const dangerSurfaceClass =
  "border border-danger-border bg-danger-muted text-danger shadow-[inset_0_1px_0_0_rgb(255_255_255/0.04)] backdrop-blur-md";

const buttonVariantClasses: Record<ButtonVariant, string> = {
  primary: "glass-button-primary",
  secondary: secondaryGlassClass,
  ghost: "glass-button-ghost",
  plain: plainIconControlClasses,
  dashed:
    "border border-dashed border-glass-border text-surface-muted hover:bg-glass hover:text-surface-foreground",
  danger: `${dangerSurfaceClass} hover:bg-danger-muted/80`,
};

const messageToneClasses: Record<MessageTone, string> = {
  error: dangerSurfaceClass,
  success:
    "border-success-border bg-success-muted text-success shadow-[inset_0_1px_0_0_rgb(255_255_255/0.04)] backdrop-blur-md",
  info: `${secondaryGlassClass} text-surface-muted`,
};

export function controlClass(size: "sm" | "md" = "md"): string {
  const sizeClass =
    size === "sm"
      ? "px-3 py-2 text-base"
      : "px-5 py-3.5 text-base";
  return `w-full ${radius.control} font-normal text-surface-foreground outline-none placeholder:font-semibold placeholder:text-surface-muted transition glass-surface glass-surface-focus ${sizeClass}`;
}

export function selectClass(size: "sm" | "md" = "md"): string {
  const sizeClass =
    size === "sm"
      ? "py-2 pl-3 pr-10 text-base"
      : "py-3.5 pl-5 pr-12 text-base";

  return `w-full ${radius.control} font-normal text-surface-foreground outline-none transition glass-surface glass-surface-focus cursor-pointer appearance-none ${sizeClass}`;
}

const buttonSizeClasses: Record<
  ButtonSize,
  { text: string; icon: string }
> = {
  sm: {
    text: `${radius.control} ${BUTTON_SM_HEIGHT_CLASS} px-3 text-sm`,
    icon: `${BUTTON_SM_HEIGHT_CLASS} w-8`,
  },
  md: {
    text: `${radius.control} ${BUTTON_MD_HEIGHT_CLASS} px-5 text-base`,
    icon: `${BUTTON_MD_HEIGHT_CLASS} w-11`,
  },
};

export function buttonVariantClass(
  variant: ButtonVariant,
  fullWidth = true,
  size: ButtonSize = "md",
): string {
  const widthClass = fullWidth ? "w-full" : "";
  const sizeClass = buttonSizeClasses[size].text;
  const focusClass = variant === "plain" ? "" : focusRingClass;

  return `inline-flex ${widthClass} shrink-0 items-center justify-center ${sizeClass} font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${focusClass} ${buttonVariantClasses[variant]}`;
}

export function iconButtonVariantClass(
  variant: ButtonVariant,
  size: ButtonSize = "md",
): string {
  const sizeClass = buttonSizeClasses[size].icon;
  const focusClass = variant === "plain" ? "" : focusRingClass;

  return `inline-flex shrink-0 items-center justify-center rounded-full ${sizeClass} transition disabled:cursor-not-allowed disabled:opacity-60 ${focusClass} ${buttonVariantClasses[variant]}`;
}

export function messageToneClass(tone: MessageTone): string {
  return `${radius.control} border px-4 py-3 text-sm ${messageToneClasses[tone]}`;
}

export function cardClass(): string {
  return `flex w-full max-w-md flex-col gap-6 p-8 text-surface-foreground ${glassSurfaceClass()}`;
}

export function cardFooterClass(): string {
  return "border-t border-surface-divider pt-4 text-sm text-surface-muted";
}

export function dividerLineClass(): string {
  return "grow border-t border-surface-divider";
}

export function pageContentClass(): string {
  return "mx-auto flex min-h-full w-full max-w-5xl flex-col gap-6";
}

export function pageShellClass(): string {
  return "mx-auto w-full max-w-5xl";
}

export function pageBackLinkClass(): string {
  return `inline-flex shrink-0 items-center justify-center rounded-full h-10 w-10 ${plainIconControlClasses}`;
}

export function pageBackGutterOffsetClass(): string {
  return "mr-2";
}

export function pageBackGutterAlignClass(): string {
  return "top-4 md:top-8 h-8 items-center";
}

/** Left padding that reserves space for the overlay back control (40px button + 8px gap). */
export function pageBackGutterReserveClass(): string {
  return "pl-12";
}

export function listRowClass(tone: GlassSurfaceTone = "default"): string {
  return `${glassSurfaceClass("default", tone)} p-4`;
}

export function authLandingClass(): string {
  return "auth-hero-background dark fixed inset-0 flex w-full flex-col items-center justify-center pt-[max(1rem,env(safe-area-inset-top,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] pb-[max(1rem,env(safe-area-inset-bottom,0px))] pl-[max(1rem,env(safe-area-inset-left,0px))]";
}

export function authHeroTitleClass(): string {
  return "text-4xl font-semibold tracking-tight text-surface-foreground sm:text-5xl";
}

export function authPanelCardClass(role?: UserRole): string {
  const borderClass = role ? roleBorderClass(role) : "border-glass-border";

  return `flex w-full max-w-sm flex-col gap-3 ${radius.card} border ${borderClass} glass-surface p-4 text-surface-foreground backdrop-blur-md transition-[border-color] duration-300`;
}

export function authPanelStackClass(): string {
  return "grid [&>*]:col-start-1 [&>*]:row-start-1";
}
export function accordionClass(tone: GlassSurfaceTone = "default"): string {
  return listRowClass(tone);
}

export function accordionNestedClass(tone: GlassSurfaceTone = "default"): string {
  return `${glassSurfaceClass("nested", tone)} p-4`;
}

export function accordionContentCardClass(variant: "default" | "nested" = "default"): string {
  const surfaceClass = variant === "nested" ? accordionNestedClass() : accordionClass();

  return `${surfaceClass} overflow-hidden p-0`;
}

export type AttachmentChipTone = "default" | "error";
export type GlassSurfaceTone = "default" | "success";
export type GlassSurfaceVariant = "default" | "nested";

export const glassSurfaceTransitionClass =
  "transition-[background-color,border-color,box-shadow] duration-300 ease-out motion-reduce:transition-none";

const glassSurfaceToneClasses: Record<
  GlassSurfaceTone,
  { border: string; background: string; highlight: string }
> = {
  default: {
    border: "border-glass-border",
    background: "bg-glass",
    highlight: "shadow-[inset_0_1px_0_0_var(--color-glass-highlight)]",
  },
  success: {
    border: "border-success-border",
    background: "bg-success-muted",
    highlight: "shadow-[inset_0_1px_0_0_rgb(255_255_255/0.04)]",
  },
};

export function glassSurfaceClass(
  variant: GlassSurfaceVariant = "default",
  tone: GlassSurfaceTone = "default",
): string {
  const toneClasses = glassSurfaceToneClasses[tone];
  const background =
    tone === "default" && variant === "nested"
      ? "bg-[var(--color-glass-nested)]"
      : toneClasses.background;

  return [
    radius.card,
    "border",
    toneClasses.border,
    background,
    toneClasses.highlight,
    "backdrop-blur-md",
    glassSurfaceTransitionClass,
  ].join(" ");
}

export function completionCheckmarkClass(complete: boolean): string {
  const base =
    "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm transition-[background-color,border-color,color] duration-300 ease-out motion-reduce:transition-none";

  return complete
    ? `${base} border-success-border bg-success-muted text-success`
    : `${base} border-glass-border text-surface-muted`;
}

const pillToneClasses: Record<PillTone, string> = {
  default: `${secondaryGlassClass} hover:bg-glass-focus`,
  danger: `${dangerSurfaceClass} hover:bg-danger-muted/80`,
};

export function pillClass(tone: PillTone = "default"): string {
  return `inline-flex items-center rounded-full px-3 py-1 ${typography.chip} transition ${pillToneClasses[tone]}`;
}

export function pillButtonClass(selected = false): string {
  const base = `inline-flex shrink-0 items-center justify-center rounded-full ${typography.chip} transition disabled:cursor-not-allowed disabled:opacity-60 ${focusRingClass}`;

  if (selected) {
    return `${base} glass-button-primary px-3 py-1.5`;
  }

  return `${base} ${secondaryGlassClass} px-3 py-1.5 hover:bg-glass-focus`;
}

export function attachmentChipClass(tone: AttachmentChipTone = "default"): string {
  const base = `inline-flex ${BUTTON_SM_HEIGHT_CLASS} items-center gap-1.5 rounded-full border pl-3 pr-1.5 text-sm transition`;

  if (tone === "error") {
    return `${base} ${dangerSurfaceClass}`;
  }

  return `${base} ${secondaryGlassClass}`;
}

export function glassControlBoxClass(): string {
  return `flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-glass-control-border bg-glass shadow-[inset_0_1px_0_0_var(--color-glass-highlight)] backdrop-blur-md transition peer-focus-visible:ring-2 peer-focus-visible:ring-white/20 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface`;
}

export function separatorClass(): string {
  return "my-1 border-t border-surface-divider";
}

export function statePanelClass(): string {
  return `flex flex-col items-center justify-center ${radius.card} px-6 py-12 text-center`;
}

export function emptyStateClass(): string {
  return `${statePanelClass()} border border-dashed border-surface-divider`;
}

export function errorStateClass(): string {
  return `${statePanelClass()} border ${dangerSurfaceClass}`;
}

export function statePanelTitleClass(): string {
  return typography.panelTitle;
}

export function statePanelDescriptionClass(): string {
  return `mt-2 max-w-md ${typography.panelDescription}`;
}

export function pageHeaderTitleClass(): string {
  return `truncate ${typography.pageTitle}`;
}

export function pageHeaderDescriptionClass(): string {
  return typography.panelDescription;
}

export function metaLabelClass(): string {
  return typography.metaLabel;
}

export function metaValueClass(): string {
  return `mt-1 min-w-0 ${typography.metaValue}`;
}

export function tabListClass(): string {
  return "-mx-1 flex gap-1 overflow-x-auto border-b border-surface-divider px-1 pb-px";
}

export function tabClass(selected: boolean): string {
  return `shrink-0 border-b-2 px-3 py-2 text-sm font-medium transition ${focusRingClass} ${
    selected
      ? "border-surface-foreground text-surface-foreground"
      : "border-transparent text-surface-muted hover:border-glass-border hover:text-surface-foreground"
  }`;
}

export function dropdownMenuClass(): string {
  return `flex min-w-[9rem] flex-col gap-0.5 overflow-hidden ${radius.menu} border border-glass-border p-1 shadow-lg glass-surface`;
}

export function dropdownItemClass(destructive = false): string {
  const base = `flex w-full items-center ${radius.menuItem} px-3 py-1.5 text-left text-sm font-medium transition ${focusRingClass}`;

  if (destructive) {
    return `${base} !text-danger hover:bg-danger-muted/40 hover:!text-danger`;
  }

  return `${base} text-surface-muted hover:bg-glass hover:text-surface-foreground`;
}

export function modalPanelClass(): string {
  return `flex max-h-[calc(100dvh-2rem)] w-full min-h-[min(16rem,70dvh)] flex-col overflow-hidden p-6 text-surface-foreground shadow-2xl ${glassSurfaceClass()}`;
}

export function modalCloseButtonClass(): string {
  return `rounded-full p-1.5 ${plainIconControlClasses}`;
}

export function modalTitleClass(): string {
  return typography.panelTitle;
}

export function chatBubbleClass(role: "user" | "assistant"): string {
  const base = "max-w-[88%] px-4 py-2.5 text-sm leading-6";

  if (role === "user") {
    return `${base} rounded-[1.125rem] rounded-br-sm bg-coach/14 text-surface-foreground`;
  }

  return `${base} rounded-[1.125rem] rounded-bl-sm border border-surface-divider/90 bg-surface-elevated text-surface-foreground`;
}
