import type { InputHTMLAttributes } from "react";
import { radius } from "@/lib/theme/tokens";

const boxClass =
  "flex h-5 w-5 shrink-0 items-center justify-center border border-glass-border bg-glass shadow-[inset_0_1px_0_0_var(--color-glass-highlight)] backdrop-blur-md transition";

export function Checkbox({
  checked,
  onChange,
  className,
  disabled,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> & {
  onChange?: (checked: boolean) => void;
}) {
  return (
    <span className={`relative inline-flex ${className ?? ""}`.trim()}>
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange?.(event.target.checked)}
        {...props}
      />
      <span
        aria-hidden="true"
        className={`${boxClass} ${radius.control} peer-focus-visible:ring-2 peer-focus-visible:ring-surface-foreground/30 peer-disabled:cursor-not-allowed peer-disabled:opacity-60 peer-checked:border-transparent peer-checked:glass-button-primary`}
      >
        {checked ? (
          <svg
            className="h-3 w-3 text-surface-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={3}
          >
            <path d="M5 13l4 4L19 7" />
          </svg>
        ) : null}
      </span>
    </span>
  );
}
