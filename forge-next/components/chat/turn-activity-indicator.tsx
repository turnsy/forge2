import { Spinner } from "@/components/ui";
import { TURN_ACTIVITY_LABEL } from "@/lib/chat/turn-activity";

export function TurnActivityIndicator({
  className = "h-3.5 w-3.5 shrink-0 border",
  align = "start",
}: {
  className?: string;
  align?: "start" | "center";
}) {
  return (
    <div
      className={
        align === "center"
          ? "flex justify-center"
          : "flex justify-start"
      }
    >
      <div className={align === "center" ? undefined : "px-1"}>
        <Spinner className={className} label={TURN_ACTIVITY_LABEL} />
      </div>
    </div>
  );
}
