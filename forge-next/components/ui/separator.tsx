import { separatorClass } from "@/lib/theme";

export function Separator({ className }: { className?: string }) {
  return (
    <div
      role="separator"
      aria-hidden="true"
      className={className ?? separatorClass()}
    />
  );
}
