import type { UserRole } from "@/lib/auth/types";

export const roleLabels: Record<UserRole, string> = {
  coach: "Coach",
  athlete: "Athlete",
};

const roleLinkBase =
  "inline-flex items-center gap-0.5 underline decoration-2 underline-offset-[6px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface";

const roleLinkColors: Record<UserRole, string> = {
  coach:
    "text-coach decoration-coach-muted hover:text-coach/80 focus-visible:ring-coach/50",
  athlete:
    "text-athlete decoration-athlete-muted hover:text-athlete/80 focus-visible:ring-athlete/50",
};

const roleBorderColors: Record<UserRole, string> = {
  coach: "border-coach-border",
  athlete: "border-athlete-border",
};

const roleMutedBorderColors: Record<UserRole, string> = {
  coach: "!border-coach-muted",
  athlete: "!border-athlete-muted",
};

const roleFocusRingColors: Record<UserRole, string> = {
  coach: "focus-visible:ring-coach/50",
  athlete: "focus-visible:ring-athlete/50",
};

export function roleLabel(role: UserRole): string {
  return roleLabels[role];
}

export function roleLinkClass(role: UserRole): string {
  return `${roleLinkBase} ${roleLinkColors[role]}`;
}

export function roleBorderClass(role: UserRole): string {
  return roleBorderColors[role];
}

export function roleMutedBorderClass(role: UserRole): string {
  return roleMutedBorderColors[role];
}

export function roleFocusRingClass(role: UserRole): string {
  return roleFocusRingColors[role];
}
