import type { ReactNode, SelectHTMLAttributes } from "react";
import { ChevronDownIcon } from "@/components/icons/chevron-down-icon";
import { selectClass } from "@/lib/theme";

function SelectChevron({ size }: { size: "sm" | "md" }) {
  return (
    <ChevronDownIcon
      className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-surface-muted ${
        size === "sm" ? "right-3" : "right-4"
      }`}
    />
  );
}

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
    <div className="relative w-full">
      <select className={selectClassName} {...props}>
        {children}
      </select>
      <SelectChevron size={size} />
    </div>
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
