import { forwardRef, type InputHTMLAttributes } from "react";
import { controlClass } from "@/lib/theme";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & {
    label?: string;
    invalid?: boolean;
  }
>(function Input({ label, className, invalid = false, ...props }, ref) {
  const invalidClass = invalid ? " border-danger-border" : "";
  const inputClassName = `${controlClass()}${invalidClass}${
    className ? ` ${className}` : ""
  }`;

  if (label) {
    return (
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        <span>{label}</span>
        <input ref={ref} className={inputClassName} {...props} />
      </label>
    );
  }

  return <input ref={ref} className={inputClassName} {...props} />;
});
