"use client";

import { useExerciseVideo } from "@/components/exercises/exercise-videos";
import { VideoIcon } from "@/components/icons/video-icon";
import { IconButton } from "@/components/ui";

export function ExerciseVideoButton({
  exerciseId,
  ariaLabel = "Watch exercise video",
  title,
}: {
  exerciseId?: string;
  ariaLabel?: string;
  title?: string;
}) {
  const videoUrl = useExerciseVideo(exerciseId);
  if (!videoUrl) return null;
  return (
    <IconButton
      variant="ghost"
      size="sm"
      icon={<VideoIcon className="h-4 w-4" />}
      aria-label={ariaLabel}
      title={title}
      onClick={() => window.open(videoUrl, "_blank", "noopener,noreferrer")}
    />
  );
}
