"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState } from "react";
import {
  useForm,
  type DefaultValues,
  type FieldValues,
} from "react-hook-form";
import type { z } from "zod";
import { toFormData } from "@/lib/forms/parse";

export function useServerActionForm<
  TFieldValues extends FieldValues,
  TResult,
>({
  schema,
  defaultValues,
  action,
}: {
  schema: z.ZodType<TFieldValues>;
  defaultValues: DefaultValues<TFieldValues>;
  action: (
    prevState: TResult | null,
    formData: FormData,
  ) => Promise<TResult | null>;
}) {
  const [state, formAction] = useActionState(action, null);
  const form = useForm<TFieldValues>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: "onChange",
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(() => {
      formAction(
        toFormData(values as Record<string, string | number | boolean>),
      );
    });
  });

  return { form, state, onSubmit };
}
