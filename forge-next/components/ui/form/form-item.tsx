"use client";

import type { ReactNode } from "react";

export function FormItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className ?? "flex flex-col gap-1.5"}>{children}</div>
  );
}
