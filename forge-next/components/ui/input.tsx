import { forwardRef, type InputHTMLAttributes } from "react";
import { controlClass } from "@/lib/theme";
import { typography } from "@/lib/theme/tokens";

export const Input = forwardRef<
  HTMLInputElement,
  Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
    label?: string;
    size?: "sm" | "md";
  }
>(function Input({ label, className, size = "md", ...props }, ref) {
  const inputClassName = `${controlClass(size)}${className ? ` ${className}` : ""}`;

  if (label) {
    return (
      <label className={`flex flex-col gap-1.5 ${typography.label}`}>
        <span>{label}</span>
        <input ref={ref} className={inputClassName} {...props} />
      </label>
    );
  }

  return <input ref={ref} className={inputClassName} {...props} />;
});
