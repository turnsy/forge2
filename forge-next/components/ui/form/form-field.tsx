"use client";

import type { ReactNode } from "react";
import {
  Controller,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import {
  FormFieldProvider,
  FormItemProvider,
} from "@/components/ui/form/form-field-context";
import { FormItem } from "@/components/ui/form/form-item";

export function FormField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>,
>({
  name,
  render,
}: {
  name: TName;
  render: ControllerProps<TFieldValues, TName>["render"];
}) {
  return (
    <FormFieldProvider name={name}>
      <Controller name={name} render={render} />
    </FormFieldProvider>
  );
}

export function FormFieldItem({ children }: { children: ReactNode }) {
  return (
    <FormItemProvider>
      <FormItem>{children}</FormItem>
    </FormItemProvider>
  );
}
