import Link from "next/link";
import type { ComponentProps } from "react";
import { buttonVariantClass, type ButtonSize, type ButtonVariant } from "@/lib/theme";

export function ButtonLink({
  href,
  variant = "secondary",
  size = "sm",
  className,
  children,
  ...props
}: ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return (
    <Link
      href={href}
      className={`${buttonVariantClass(variant, false, size)}${className ? ` ${className}` : ""}`}
      {...props}
    >
      {children}
    </Link>
  );
}
