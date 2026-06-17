import type { ReactNode, SelectHTMLAttributes } from "react";
import { selectClass } from "@/lib/theme";

export function Select({
  label,
  hideLabel = false,
  wrapperClassName,
  className,
  size = "md",
  children,
  ...props
}: Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> & {
  label?: string;
  hideLabel?: boolean;
  wrapperClassName?: string;
  size?: "sm" | "md";
  children: ReactNode;
}) {
  const selectClassName = `${selectClass(size)}${className ? ` ${className}` : ""}`;
  const select = (
    <select className={selectClassName} {...props}>
      {children}
    </select>
  );

  if (label) {
    return (
      <label
        className={`flex flex-col gap-1.5 text-sm font-medium${wrapperClassName ? ` ${wrapperClassName}` : ""}`}
      >
        <span className={hideLabel ? "sr-only" : undefined}>{label}</span>
        {select}
      </label>
    );
  }

  return select;
}
