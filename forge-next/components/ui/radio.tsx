import type { InputHTMLAttributes } from "react";
import { glassControlBoxClass } from "@/lib/theme";

export function Radio({
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
        type="radio"
        className="peer sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange?.(event.target.checked)}
        {...props}
      />
      <span
        aria-hidden="true"
        className={`${glassControlBoxClass()} peer-disabled:cursor-not-allowed peer-disabled:opacity-60 peer-checked:border-surface-foreground`}
      >
        {checked ? (
          <span className="h-2.5 w-2.5 rounded-full bg-surface-foreground" />
        ) : null}
      </span>
    </span>
  );
}
