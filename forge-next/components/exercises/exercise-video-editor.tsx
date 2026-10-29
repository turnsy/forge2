"use client";

import { useState } from "react";
import { VideoIcon } from "@/components/icons/video-icon";
import { Button, IconButton, Input, Message } from "@/components/ui";
import { Modal } from "@/components/ui/modal";
import { exerciseVideoInput } from "@/lib/exercises/video-url";
import {
  notifyExerciseVideoChanged,
  useExerciseVideo,
} from "./exercise-videos";

export function ExerciseVideoEditor({
  exerciseId,
  name,
  videoUrl,
  disabled,
  onResolved,
  onSaved,
}: {
  exerciseId?: string;
  name: string;
  videoUrl?: string | null;
  disabled?: boolean;
  onResolved?: (id: string) => void;
  onSaved?: (url: string | null) => void;
}) {
  const libraryUrl = useExerciseVideo(exerciseId);
  const currentUrl = videoUrl === undefined ? libraryUrl : videoUrl;
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [pendingAction, setPendingAction] = useState<"save" | "remove" | null>(
    null,
  );
  const busy = pendingAction !== null;
  const [error, setError] = useState<string | null>(null);
  async function save(videoUrl = value, action: "save" | "remove" = "save") {
    const parsed = exerciseVideoInput.safeParse({ videoUrl });
    if (!parsed.success) {
      setError("Enter a valid http or https video URL.");
      return;
    }
    setPendingAction(action);
    setError(null);
    try {
      let id = exerciseId;
      if (!id) {
        const response = await fetch("/api/coach/exercises/confirm", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name }),
        });
        const result = await response.json();
        if (!response.ok)
          throw new Error(result.error ?? "Could not create exercise.");
        id = result.exercise.id as string;
        onResolved?.(id);
      }
      const response = await fetch(`/api/coach/exercises/${id}/video`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error ?? "Could not save exercise video.");
      notifyExerciseVideoChanged(id, result.videoUrl);
      onSaved?.(result.videoUrl);
      setOpen(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPendingAction(null);
    }
  }
  return (
    <>
      <IconButton
        variant={currentUrl ? "ghost" : "dashed"}
        size="sm"
        icon={<VideoIcon className="h-4 w-4" />}
        aria-label="Edit exercise video"
        title="Edit exercise video"
        disabled={disabled || !name.trim()}
        onClick={() => {
          setValue(currentUrl ?? "");
          setError(null);
          setOpen(true);
        }}
      />
      <Modal
        open={open}
        title="Exercise video link"
        onClose={() => {
          if (!busy) setOpen(false);
        }}
      >
        <div className="space-y-4">
          <p className="text-sm text-surface-muted">{name}</p>
          <p className="text-sm text-surface-muted">
            Saved immediately to your exercise library and used everywhere this
            exercise appears. Plan saving is separate.
          </p>
          <Input
            label="Video URL"
            value={value}
            placeholder="https://"
            disabled={busy}
            onChange={(e) => setValue(e.target.value)}
          />
          {error ? <Message tone="error">{error}</Message> : null}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {currentUrl ? (
              <Button
                fullWidth={false}
                variant="danger"
                disabled={busy}
                onClick={() => void save("", "remove")}
              >
                {pendingAction === "remove" ? "Removing…" : "Remove video"}
              </Button>
            ) : (
              <span />
            )}
            <div className="flex justify-end gap-2">
              <Button
                fullWidth={false}
                variant="secondary"
                disabled={busy}
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                fullWidth={false}
                disabled={busy}
                onClick={() => void save()}
              >
                {pendingAction === "save" ? "Saving…" : "Save video"}
              </Button>
            </div>
          </div>
          {currentUrl ? (
            <p className="text-sm text-surface-muted">
              Removing the video removes it everywhere this exercise is used.
            </p>
          ) : null}
        </div>
      </Modal>
    </>
  );
}
