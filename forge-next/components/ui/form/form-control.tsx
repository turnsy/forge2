"use client";

import { cloneElement, type HTMLAttributes, type ReactElement } from "react";
import { useFormField } from "@/components/ui/form/form-field-context";

type FormControlElementProps = HTMLAttributes<HTMLElement> & {
  invalid?: boolean;
};

export function FormControl({
  children,
}: {
  children: ReactElement<FormControlElementProps>;
}) {
  const { error, formItemId, formDescriptionId, formMessageId } =
    useFormField();

  return cloneElement<FormControlElementProps>(children, {
    id: formItemId,
    "aria-describedby": error
      ? `${formDescriptionId} ${formMessageId}`
      : formDescriptionId,
    "aria-invalid": error ? true : undefined,
    invalid: error ? true : undefined,
  });
}
