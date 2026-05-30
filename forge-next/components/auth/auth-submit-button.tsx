"use client";

import { useFormStatus } from "react-dom";

const variantStyles = {
  primary:
    "border border-white/25 bg-white/90 text-zinc-900 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5),0_8px_24px_-12px_rgba(0,0,0,0.5)] backdrop-blur-md hover:border-white/40 hover:bg-white/95 dark:border-white/25 dark:bg-white/90 dark:text-zinc-900 dark:hover:border-white/40 dark:hover:bg-white/95",
  inverted:
    "border border-white/10 bg-white/[0.06] text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] backdrop-blur-md hover:border-white/20 hover:bg-white/[0.1] dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:hover:border-white/20 dark:hover:bg-white/[0.1]",
} as const;

export function AuthSubmitButton({
  children,
  pendingLabel = "Please wait…",
  disabled = false,
  variant = "primary",
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  disabled?: boolean;
  variant?: keyof typeof variantStyles;
}) {
  const { pending } = useFormStatus();
  const isDisabled = pending || disabled;

  return (
    <button
      type="submit"
      disabled={isDisabled}
      className={`inline-flex w-full items-center justify-center rounded-3xl px-5 py-3.5 text-base font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${variantStyles[variant]}`}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
