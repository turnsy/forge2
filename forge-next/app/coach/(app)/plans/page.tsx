import { PlanList } from "@/components/plan-list";
import { PlusIcon } from "@/components/icons/plus-icon";
import { Button, PageContent, PageHeader } from "@/components/ui";
import { requireRole } from "@/lib/auth/session";
import { listCoachPlans } from "@/lib/plans/repository";

export default async function CoachPlansPage() {
  const user = await requireRole("coach");
  const plans = await listCoachPlans(user.id);

  return (
    <PageContent>
      <PageHeader
        title="Plans"
        actions={
          <Button
            type="button"
            variant="secondary"
            size="sm"
            fullWidth={false}
            icon={<PlusIcon />}
          >
            New
          </Button>
        }
      />
      <PlanList plans={plans} />
    </PageContent>
  );
}
