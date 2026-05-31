import { PencilIcon } from "@/components/icons/pencil-icon";
import { Button, PageContent, PageHeader } from "@/components/ui";

export default async function CoachPlanDetailPage({
  params,
}: {
  params: Promise<{ planId: string }>;
}) {
  const { planId } = await params;

  return (
    <PageContent>
      <PageHeader
        title="Plan"
        actions={
          <Button
            type="button"
            variant="secondary"
            size="sm"
            fullWidth={false}
            icon={<PencilIcon />}
          >
            Edit
          </Button>
        }
      />
      <p className="text-sm text-surface-muted">Plan ID: {planId}</p>
    </PageContent>
  );
}
