import { AthleteList } from "@/components/athlete-list";
import { PlusIcon } from "@/components/icons/plus-icon";
import { Button, PageContent, PageHeader } from "@/components/ui";
import { listCoachAthletes } from "@/lib/athletes/repository";
import { requireRole } from "@/lib/auth/session";

export default async function CoachAthletesPage() {
  await requireRole("coach");
  const athletes = await listCoachAthletes();

  return (
    <PageContent>
      <PageHeader
        title="Athletes"
        actions={
          <Button
            type="button"
            variant="secondary"
            size="sm"
            fullWidth={false}
            icon={<PlusIcon />}
          >
            Add
          </Button>
        }
      />
      <AthleteList athletes={athletes} />
    </PageContent>
  );
}
