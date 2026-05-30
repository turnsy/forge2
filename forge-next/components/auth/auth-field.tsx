import type { InputHTMLAttributes } from "react";
import { controlClass } from "@/lib/theme";

export function AuthField({
  label,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  if (label) {
    return (
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        <span>{label}</span>
        <input className={controlClass()} {...props} />
      </label>
    );
  }

  return <input className={controlClass()} {...props} />;
}
