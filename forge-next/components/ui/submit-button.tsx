"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import type { ButtonVariant } from "@/lib/theme";

export function SubmitButton({
  children,
  pendingLabel = "Please wait…",
  disabled = false,
  variant = "primary",
  fullWidth = true,
  icon,
  className,
}: {
  children: ReactNode;
  pendingLabel?: string;
  disabled?: boolean;
  variant?: ButtonVariant;
  fullWidth?: boolean;
  icon?: ReactNode;
  className?: string;
}) {
  const { pending } = useFormStatus();
  const isDisabled = pending || disabled;

  return (
    <Button
      type="submit"
      disabled={isDisabled}
      variant={variant}
      fullWidth={fullWidth}
      icon={icon}
      className={className}
    >
      {pending ? pendingLabel : children}
    </Button>
  );
}
