"use client";

import { useCallback, useState } from "react";

export type SaveArtifactStatus = "idle" | "saving" | "saved";

export type SaveArtifactResult<T> =
  | { ok: true; value: T }
  | { ok: false; message: string };

export function useSaveArtifact<TInput, TResult>(options: {
  save: (input: TInput) => Promise<SaveArtifactResult<TResult>>;
  successStatus?: SaveArtifactStatus | ((result: TResult) => SaveArtifactStatus);
}) {
  const [saveStatus, setSaveStatus] = useState<SaveArtifactStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

  const save = useCallback(
    async (input: TInput): Promise<TResult | null> => {
      setSaveStatus("saving");
      setSaveError(null);

      const result = await options.save(input);

      if (!result.ok) {
        setSaveStatus("idle");
        setSaveError(result.message);
        return null;
      }

      const nextStatus =
        typeof options.successStatus === "function"
          ? options.successStatus(result.value)
          : (options.successStatus ?? "saved");

      setSaveStatus(nextStatus);
      return result.value;
    },
    [options],
  );

  const resetSaveStatus = useCallback(() => {
    setSaveStatus("idle");
    setSaveError(null);
  }, []);

  return {
    saveStatus,
    saveError,
    save,
    resetSaveStatus,
  };
}
