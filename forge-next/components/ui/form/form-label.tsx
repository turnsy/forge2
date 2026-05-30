"use client";

import type { LabelHTMLAttributes } from "react";
import { useFormField } from "@/components/ui/form/form-field-context";

export function FormLabel({
  children,
  className,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
  const { error, formItemId } = useFormField();

  return (
    <label
      htmlFor={formItemId}
      className={
        className ??
        `text-sm font-medium ${error ? "text-danger" : "text-surface-foreground"}`
      }
      {...props}
    >
      {children}
    </label>
  );
}
