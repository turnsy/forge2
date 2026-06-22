import { ListSectionSpinner } from "@/components/ui";

export function CoachSessionLoadingView() {
  return (
    <div
      className="flex min-h-0 flex-1 flex-col items-center justify-center"
      role="status"
      aria-label="Loading conversation"
    >
      <ListSectionSpinner />
    </div>
  );
}
