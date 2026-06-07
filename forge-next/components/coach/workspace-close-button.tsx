"use client";

import { XIcon } from "@/components/icons/x-icon";
import { pageBackLinkClass } from "@/lib/theme";

export function WorkspaceCloseButton({
  onClick,
  disabled = false,
  className,
}: {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label="Close workspace"
      disabled={disabled}
      onClick={onClick}
      className={`${pageBackLinkClass()} disabled:pointer-events-none disabled:opacity-40${className ? ` ${className}` : ""}`}
    >
      <XIcon />
    </button>
  );
}
