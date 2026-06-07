import { Pill } from "@/components/ui/pill";
import { ROUTE_TRANSITION_FORWARD_TYPES } from "@/lib/motion/route-transitions";

export function PendingInvitesPill({ count }: { count: number }) {
  if (count <= 0) {
    return null;
  }

  return (
    <Pill
      href="/coach/athletes/pending"
      tone="danger"
      transitionTypes={[...ROUTE_TRANSITION_FORWARD_TYPES]}
    >
      Pending ({count})
    </Pill>
  );
}
