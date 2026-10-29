import { PageContent, PageHeader } from "@/components/ui";
import { MetadataFieldEditor } from "@/components/metadata/metadata-field-editor";
export default function CoachSettingsPage() {
  return (
    <PageContent header={<PageHeader title="Settings" />}>
      <MetadataFieldEditor />
    </PageContent>
  );
}
