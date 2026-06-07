import { Pill } from "@/components/ui/pill";

export function PendingInvitesPill({ count }: { count: number }) {
  if (count <= 0) {
    return null;
  }

  return (
    <Pill href="/coach/athletes/pending" tone="danger">
      Pending ({count})
    </Pill>
  );
}
