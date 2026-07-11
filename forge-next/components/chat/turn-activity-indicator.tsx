import { Spinner } from "@/components/ui";

export function TurnActivityIndicator({
  label,
  className = "h-3.5 w-3.5 shrink-0 border",
  align = "start",
  textClassName = "text-sm text-surface-muted",
}: {
  label: string;
  className?: string;
  align?: "start" | "center";
  textClassName?: string;
}) {
  return (
    <div
      className={
        align === "center"
          ? "flex justify-center"
          : "flex justify-start"
      }
    >
      <div
        className={`flex items-center gap-2 ${align === "center" ? "" : "px-1"}`}
      >
        <Spinner className={className} label={label} />
        <span className={textClassName}>{label}</span>
      </div>
    </div>
  );
}
