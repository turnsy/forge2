import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "./button";
import { PageContent } from "./page-content";
import { PageHeader } from "./page-header";
import { tallDecorator } from "../../.storybook/decorators";

const meta = {
  title: "UI/PageContent",
  component: PageContent,
  tags: ["autodocs"],
  decorators: [tallDecorator],
  args: {
    header: <PageHeader title="Athletes" description="Manage roster and assignments." />,
  },
} satisfies Meta<typeof PageContent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Scrollable: Story = {
  render: (args) => (
    <PageContent
      {...args}
      footer={
        <Button fullWidth={false} className="ml-auto">
          Invite athlete
        </Button>
      }
    >
      <div className="space-y-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className="rounded-card border border-glass-border bg-glass p-4 text-sm text-surface-muted"
          >
            Athlete row {index + 1}
          </div>
        ))}
      </div>
    </PageContent>
  ),
};

export const Static: Story = {
  args: {
    scrollable: false,
    header: undefined,
  },
  render: (args) => (
    <PageContent {...args}>
      <p className="text-sm text-surface-muted">Non-scrollable page content wrapper.</p>
    </PageContent>
  ),
};
