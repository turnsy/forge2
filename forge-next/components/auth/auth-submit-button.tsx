"use client";

import { useFormStatus } from "react-dom";
import { buttonVariantClass, type ButtonVariant } from "@/lib/theme";

export function AuthSubmitButton({
  children,
  pendingLabel = "Please wait…",
  disabled = false,
  variant = "primary",
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  disabled?: boolean;
  variant?: ButtonVariant;
}) {
  const { pending } = useFormStatus();
  const isDisabled = pending || disabled;

  return (
    <button
      type="submit"
      disabled={isDisabled}
      className={buttonVariantClass(variant)}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
