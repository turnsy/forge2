"use client";

import { RotateIcon } from "@/components/icons/rotate-icon";
import { XIcon } from "@/components/icons/x-icon";
import { IconButton } from "@/components/ui";

export function WorkspaceCloseButton({
  onClick,
  disabled = false,
  className,
  variant = "reset",
  ariaLabel,
}: {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  variant?: "reset" | "close";
  ariaLabel?: string;
}) {
  const resolvedAriaLabel =
    ariaLabel ?? (variant === "close" ? "Close" : "Reset conversation");

  return (
    <IconButton
      variant="secondary"
      size="sm"
      className={className}
      icon={variant === "close" ? <XIcon /> : <RotateIcon />}
      aria-label={resolvedAriaLabel}
      disabled={disabled}
      onClick={onClick}
    />
  );
}
