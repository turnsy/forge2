import { requireRole } from "@/lib/auth/session";
import { PageContent, PageHeader } from "@/components/ui";
import { CoachExerciseLibrary } from "@/components/coach-exercise-library";
export default async function ExercisesPage() {
  await requireRole("coach");
  return (
    <PageContent listLayout header={<PageHeader title="Exercises" />}>
      <CoachExerciseLibrary />
    </PageContent>
  );
}
