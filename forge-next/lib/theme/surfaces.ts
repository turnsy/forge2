import type { UserRole } from "@/lib/auth/types";
import { radius } from "@/lib/theme/tokens";
import { roleBorderClass } from "@/lib/theme/roles";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";
export type MessageTone = "error" | "success" | "info";
export type PillTone = "default" | "danger";

const buttonVariantClasses: Record<ButtonVariant, string> = {
  primary: "glass-button-primary",
  secondary:
    "border border-glass-border bg-glass text-surface-foreground shadow-[inset_0_1px_0_0_var(--color-glass-highlight)] backdrop-blur-md hover:bg-glass-focus",
  ghost: "glass-button-ghost",
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

export function cardClass(role?: UserRole): string {
  const borderClass = role ? roleBorderClass(role) : "border-surface-divider";

  return `dark flex w-full max-w-md flex-col gap-6 ${radius.card} border bg-surface p-8 text-surface-foreground shadow-sm ${borderClass}`;
}

export function cardFooterClass(): string {
  return "border-t border-surface-divider pt-4 text-sm text-surface-muted";
}

export function dividerLineClass(): string {
  return "grow border-t border-surface-divider";
}

export function pageContentClass(): string {
  return "mx-auto flex min-h-full w-full max-w-5xl flex-col gap-6 p-8";
}

export function pageShellClass(): string {
  return "mx-auto w-full max-w-5xl p-8";
}

export function pageBackLinkClass(): string {
  return "inline-flex shrink-0 items-center justify-center rounded-full h-10 w-10 text-surface-muted transition hover:bg-glass hover:text-surface-foreground outline-none focus:outline-none focus-visible:outline-none";
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

export function listRowClass(): string {
  return `${radius.card} border border-glass-border bg-glass p-4 shadow-[inset_0_1px_0_0_var(--color-glass-highlight)] backdrop-blur-md`;
}

export function authLandingClass(): string {
  return "auth-hero-background dark flex min-h-dvh w-full flex-col items-center justify-center px-4 py-4";
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
export function accordionClass(): string {
  return listRowClass();
}

export function accordionNestedClass(): string {
  return `${radius.card} border border-glass-border bg-[var(--color-glass-nested)] p-4 shadow-[inset_0_1px_0_0_var(--color-glass-highlight)] backdrop-blur-md`;
}

export function accordionContentCardClass(variant: "default" | "nested" = "default"): string {
  const surfaceClass = variant === "nested" ? accordionNestedClass() : accordionClass();

  return `${surfaceClass} overflow-hidden p-0`;
}

export type AttachmentChipTone = "default" | "error";

const pillToneClasses: Record<PillTone, string> = {
  default:
    "border border-glass-border bg-glass text-surface-foreground shadow-[inset_0_1px_0_0_var(--color-glass-highlight)] backdrop-blur-md hover:bg-glass-focus",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

export function pillClass(tone: PillTone = "default"): string {
  return `inline-flex items-center rounded-full px-3 py-1 text-sm font-medium transition ${pillToneClasses[tone]}`;
}

export function attachmentChipClass(tone: AttachmentChipTone = "default"): string {
  const base =
    "inline-flex items-center gap-1.5 rounded-full border py-1.5 text-sm shadow-[inset_0_1px_0_0_var(--color-glass-highlight)]";

  if (tone === "error") {
    return `${base} border-red-500/40 bg-red-500/10 pl-3 pr-1.5 text-red-200`;
  }

  return `${base} border-glass-border bg-glass pl-3 pr-1.5 text-surface-foreground`;
}
