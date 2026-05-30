"use client";

import { useFormField } from "@/components/ui/form/form-field-context";

export function FormMessage({ className }: { className?: string }) {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error.message ?? "") : "";

  if (!body) {
    return null;
  }

  return (
    <p
      id={formMessageId}
      role="alert"
      className={
        className ?? "text-sm font-medium text-danger"
      }
    >
      {body}
    </p>
  );
}
