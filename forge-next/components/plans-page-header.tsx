import { PlusIcon } from "@/components/icons/plus-icon";
import { Button, PageHeader } from "@/components/ui";

export function PlansPageHeader() {
  return (
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
  );
}
