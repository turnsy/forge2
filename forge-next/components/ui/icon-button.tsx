import type { ButtonHTMLAttributes, ReactNode } from "react";
import {
  iconButtonVariantClass,
  type ButtonSize,
  type ButtonVariant,
} from "@/lib/theme";

export function IconButton({
  variant = "primary",
  size = "md",
  icon,
  className,
  "aria-label": ariaLabel,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon: ReactNode;
  "aria-label": string;
}) {
  return (
    <button
      type={type}
      aria-label={ariaLabel}
      className={`${iconButtonVariantClass(variant, size)}${className ? ` ${className}` : ""}`}
      {...props}
    >
      {icon}
    </button>
  );
}
