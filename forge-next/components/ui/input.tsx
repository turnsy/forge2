import type { InputHTMLAttributes } from "react";
import { controlClass } from "@/lib/theme";

export function Input({
  label,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  const inputClassName = `${controlClass()}${className ? ` ${className}` : ""}`;

  if (label) {
    return (
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        <span>{label}</span>
        <input className={inputClassName} {...props} />
      </label>
    );
  }

  return <input className={inputClassName} {...props} />;
}
