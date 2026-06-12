"use client";

import { XIcon } from "@/components/icons/x-icon";
import { IconButton } from "@/components/ui";

export function WorkspaceCloseButton({
  onClick,
  disabled = false,
  className,
  ariaLabel = "Close workspace",
}: {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <IconButton
      variant="secondary"
      size="sm"
      className={className}
      icon={<XIcon />}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
    />
  );
}
