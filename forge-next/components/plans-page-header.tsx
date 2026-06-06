import { PlusIcon } from "@/components/icons/plus-icon";
import { ButtonLink, PageHeader } from "@/components/ui";

export function PlansPageHeader() {
  return (
    <PageHeader
      title="Plans"
      actions={
        <ButtonLink
          href="/coach"
          variant="secondary"
          size="sm"
          className="inline-flex items-center gap-2"
        >
          <PlusIcon />
          New
        </ButtonLink>
      }
    />
  );
}
