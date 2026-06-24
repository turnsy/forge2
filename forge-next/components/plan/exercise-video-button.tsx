import { VideoIcon } from "@/components/icons/video-icon";
import { IconButton } from "@/components/ui";

export function ExerciseVideoButton({
  videoUrl,
  ariaLabel = "Watch exercise video",
  title,
}: {
  videoUrl: string;
  ariaLabel?: string;
  title?: string;
}) {
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
