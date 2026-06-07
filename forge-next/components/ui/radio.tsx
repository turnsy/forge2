import type { InputHTMLAttributes } from "react";

const ringClass =
  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-glass-border bg-glass shadow-[inset_0_1px_0_0_var(--color-glass-highlight)] backdrop-blur-md transition";

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
        className={`${ringClass} peer-focus-visible:ring-2 peer-focus-visible:ring-surface-foreground/30 peer-disabled:cursor-not-allowed peer-disabled:opacity-60 peer-checked:border-surface-foreground`}
      >
        {checked ? (
          <span className="h-2.5 w-2.5 rounded-full bg-surface-foreground" />
        ) : null}
      </span>
    </span>
  );
}
