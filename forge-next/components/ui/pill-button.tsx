import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { pillButtonClass } from "@/lib/theme";

export const PillButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & {
    selected?: boolean;
    children: ReactNode;
  }
>(function PillButton(
  { selected = false, className, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      className={`${pillButtonClass(selected)}${className ? ` ${className}` : ""}`}
      {...props}
    >
      {children}
    </button>
  );
});
