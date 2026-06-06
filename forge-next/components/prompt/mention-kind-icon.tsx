import { AthletesIcon, PlansIcon } from "@/components/icons/sidebar-nav-icons";
import type { PromptMentionItem } from "@/lib/prompts/mentions/types";

export function MentionKindIcon({
  kind,
  className = "h-4 w-4 shrink-0 text-surface-muted",
}: {
  kind: PromptMentionItem["kind"];
  className?: string;
}) {
  return kind === "athlete" ? (
    <AthletesIcon className={className} />
  ) : (
    <PlansIcon className={className} />
  );
}
