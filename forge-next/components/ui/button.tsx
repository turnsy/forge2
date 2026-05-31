import type { ButtonHTMLAttributes, ReactNode } from "react";
import { buttonVariantClass, type ButtonSize, type ButtonVariant } from "@/lib/theme";

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = true,
  icon,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  icon?: ReactNode;
}) {
  const content = icon ? (
    <span
      className={`inline-flex items-center ${size === "sm" ? "gap-1.5" : "gap-3"}`}
    >
      {icon}
      {children}
    </span>
  ) : (
    children
  );

  return (
    <button
      className={`${buttonVariantClass(variant, fullWidth, size)}${className ? ` ${className}` : ""}`}
      {...props}
    >
      {content}
    </button>
  );
}
