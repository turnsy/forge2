"use client";

import { createContext, useContext, useId } from "react";
import {
  useFormContext,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

type FormFieldContextValue = {
  name: string;
};

const FormFieldContext = createContext<FormFieldContextValue | null>(null);

const FormItemContext = createContext<{ id: string } | null>(null);

export function FormFieldProvider({
  name,
  children,
}: {
  name: string;
  children: React.ReactNode;
}) {
  return (
    <FormFieldContext.Provider value={{ name }}>
      {children}
    </FormFieldContext.Provider>
  );
}

export function FormItemProvider({ children }: { children: React.ReactNode }) {
  const id = useId();

  return (
    <FormItemContext.Provider value={{ id }}>{children}</FormItemContext.Provider>
  );
}

export function useFormField<TFieldValues extends FieldValues>() {
  const fieldContext = useContext(FormFieldContext);
  const itemContext = useContext(FormItemContext);
  const { getFieldState, formState } = useFormContext<TFieldValues>();

  if (!fieldContext) {
    throw new Error("useFormField must be used within FormField");
  }

  const fieldState = getFieldState(
    fieldContext.name as FieldPath<TFieldValues>,
    formState,
  );
  const itemId = itemContext?.id ?? fieldContext.name;

  return {
    name: fieldContext.name,
    id: itemId,
    formItemId: `${itemId}-form-item`,
    formDescriptionId: `${itemId}-form-item-description`,
    formMessageId: `${itemId}-form-item-message`,
    ...fieldState,
  };
}
