"use client";

import type { FormHTMLAttributes, ReactNode } from "react";
import {
  FormProvider,
  type FieldValues,
  type UseFormReturn,
} from "react-hook-form";

export function Form<TFieldValues extends FieldValues>({
  form,
  onSubmit,
  children,
  className,
  ...props
}: {
  form: UseFormReturn<TFieldValues, unknown, unknown>;
  onSubmit: FormHTMLAttributes<HTMLFormElement>["onSubmit"];
  children: ReactNode;
  className?: string;
} & Omit<FormHTMLAttributes<HTMLFormElement>, "onSubmit">) {
  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className={className} noValidate {...props}>
        {children}
      </form>
    </FormProvider>
  );
}
