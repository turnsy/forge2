import type { ReactNode } from "react";
import { metaLabelClass, metaValueClass } from "@/lib/theme";

export function MetaItem({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className={metaLabelClass()}>{label}</dt>
      <dd className={metaValueClass()}>{value}</dd>
    </div>
  );
}
