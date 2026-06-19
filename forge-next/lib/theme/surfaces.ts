import type { UserRole } from "@/lib/auth/types";
import { radius } from "@/lib/theme/tokens";
import { roleBorderClass } from "@/lib/theme/roles";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "plain" | "danger";
export type ButtonSize = "sm" | "md";
export type MessageTone = "error" | "success" | "info";
export type PillTone = "default" | "danger";

const plainIconControlClasses =
  "text-surface-muted transition hover:bg-glass hover:text-surface-foreground outline-none focus:outline-none focus-visible:outline-none";

const buttonVariantClasses: Record<ButtonVariant, string> = {
  primary: "glass-button-primary",
  secondary:
    "border border-glass-border bg-glass text-surface-foreground shadow-[inset_0_1px_0_0_var(--color-glass-highlight)] backdrop-blur-md hover:bg-glass-focus",
  ghost: "glass-button-ghost",
  plain: plainIconControlClasses,
  danger:
    "border border-danger-border bg-danger-muted text-danger shadow-[inset_0_1px_0_0_rgb(255_255_255/0.04)] backdrop-blur-md hover:bg-danger-muted/80",
};

const messageToneClasses: Record<MessageTone, string> = {
  error:
    "border-danger-border bg-danger-muted text-danger shadow-[inset_0_1px_0_0_rgb(255_255_255/0.04)] backdrop-blur-md",
  success:
    "border-success-border bg-success-muted text-success shadow-[inset_0_1px_0_0_rgb(255_255_255/0.04)] backdrop-blur-md",
  info: "border-glass-border bg-glass text-surface-muted shadow-[inset_0_1px_0_0_var(--color-glass-highlight)] backdrop-blur-md",
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

  return `w-full ${radius.control} font-normal text-surface-foreground outline-none transition glass-surface glass-surface-focus cursor-pointer ${sizeClass}`;
}

export function buttonVariantClass(
  variant: ButtonVariant,
  fullWidth = true,
  size: ButtonSize = "md",
): string {
  const widthClass = fullWidth ? "w-full" : "";
  const sizeClass =
    size === "sm"
      ? `${radius.card} px-3 py-1.5 text-sm`
      : `${radius.control} px-5 py-3.5 text-base`;

  return `inline-flex ${widthClass} items-center justify-center ${sizeClass} font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${buttonVariantClasses[variant]}`;
}

export function iconButtonVariantClass(
  variant: ButtonVariant,
  size: ButtonSize = "md",
): string {
  const sizeClass = size === "sm" ? "h-9 w-9" : "h-11 w-11";

  return `inline-flex shrink-0 items-center justify-center rounded-full ${sizeClass} transition disabled:cursor-not-allowed disabled:opacity-60 ${buttonVariantClasses[variant]}`;
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
  return "mx-auto flex min-h-full w-full max-w-5xl flex-col gap-6 p-4 md:p-8";
}

export function pageShellClass(): string {
  return "mx-auto w-full max-w-5xl p-4 md:p-8";
}

export function pageBackLinkClass(): string {
  return `inline-flex shrink-0 items-center justify-center rounded-full h-10 w-10 ${plainIconControlClasses}`;
}

export function pageBackGutterOffsetClass(): string {
  return "mr-2";
}

export function pageBackGutterAlignClass(): string {
  return "top-0 h-8 items-center";
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
  default:
    "border border-glass-border bg-glass text-surface-foreground shadow-[inset_0_1px_0_0_var(--color-glass-highlight)] backdrop-blur-md hover:bg-glass-focus",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

export function pillClass(tone: PillTone = "default"): string {
  return `inline-flex items-center rounded-full px-3 py-1 text-sm font-medium transition ${pillToneClasses[tone]}`;
}

export function pillButtonClass(selected = false): string {
  const base =
    "inline-flex shrink-0 items-center justify-center rounded-full font-medium transition disabled:cursor-not-allowed disabled:opacity-60";

  if (selected) {
    return `${base} glass-button-primary px-3 py-1.5 text-xs`;
  }

  return `${base} border border-glass-border bg-glass px-3 py-1.5 text-xs text-surface-foreground shadow-[inset_0_1px_0_0_var(--color-glass-highlight)] backdrop-blur-md hover:bg-glass-focus`;
}

export function attachmentChipClass(tone: AttachmentChipTone = "default"): string {
  const base =
    "inline-flex items-center gap-1.5 rounded-full border py-1.5 text-sm shadow-[inset_0_1px_0_0_var(--color-glass-highlight)]";

  if (tone === "error") {
    return `${base} border-red-500/40 bg-red-500/10 pl-3 pr-1.5 text-red-200`;
  }

  return `${base} border-glass-border bg-glass pl-3 pr-1.5 text-surface-foreground`;
}
