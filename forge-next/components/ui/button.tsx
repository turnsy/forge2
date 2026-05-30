import type { ButtonHTMLAttributes, ReactNode } from "react";
import { buttonVariantClass, type ButtonVariant } from "@/lib/theme";

export function Button({
  variant = "primary",
  fullWidth = true,
  icon,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  icon?: ReactNode;
}) {
  const content = icon ? (
    <span className="inline-flex items-center gap-3">
      {icon}
      {children}
    </span>
  ) : (
    children
  );

  return (
    <button
      className={`${buttonVariantClass(variant, fullWidth)}${className ? ` ${className}` : ""}`}
      {...props}
    >
      {content}
    </button>
  );
}
