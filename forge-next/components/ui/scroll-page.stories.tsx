import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "./button";
import { PageHeader } from "./page-header";
import { ScrollPage } from "./scroll-page";
import { tallDecorator } from "../../.storybook/decorators";

const meta = {
  title: "UI/ScrollPage",
  component: ScrollPage,
  tags: ["autodocs"],
  decorators: [tallDecorator],
  args: {
    header: <PageHeader title="Assignments" description="Scrollable page body with overlay chrome." />,
    back: {
      href: "/coach",
      ariaLabel: "Back to dashboard",
    },
  },
} satisfies Meta<typeof ScrollPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <ScrollPage
      {...args}
      footer={
        <Button fullWidth={false} className="ml-auto">
          Assign plan
        </Button>
      }
    >
      <div className="space-y-3">
        {Array.from({ length: 10 }, (_, index) => (
          <div
            key={index}
            className="rounded-card border border-glass-border bg-glass p-4 text-sm text-surface-muted"
          >
            Scroll item {index + 1}
          </div>
        ))}
      </div>
    </ScrollPage>
  ),
};
