import type { InputHTMLAttributes } from "react";
import { glassControlBoxClass } from "@/lib/theme";

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
        className={`${glassControlBoxClass()} peer-disabled:cursor-not-allowed peer-disabled:opacity-60 peer-checked:border-transparent peer-checked:glass-button-primary peer-checked:text-zinc-900`}
      >
        {checked ? (
          <svg
            className="h-3 w-3 text-current"
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
