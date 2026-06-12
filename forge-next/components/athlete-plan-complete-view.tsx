import { ButtonLink } from "@/components/ui";

export function AthletePlanCompleteView({
  planName,
  coachName,
}: {
  planName: string;
  coachName: string;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">All workouts complete! 🎉</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {planName} with {coachName}
        </p>
      </div>
      <ButtonLink href="/athlete" variant="primary" size="md">
        Back to Home
      </ButtonLink>
    </div>
  );
}
