import Link from "next/link";

export function PendingInvitesPill({ count }: { count: number }) {
  if (count <= 0) {
    return null;
  }

  return (
    <Link
      href="/coach/athletes/pending"
      className="inline-flex items-center rounded-full bg-red-600 px-3 py-1 text-sm font-medium text-white hover:bg-red-700"
    >
      Pending ({count})
    </Link>
  );
}
