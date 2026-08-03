import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "./button";
import { PageHeader } from "./page-header";
import { PageShell } from "./page-shell";
import { tallDecorator } from "../../.storybook/decorators";

const meta = {
  title: "UI/PageShell",
  component: PageShell,
  tags: ["autodocs"],
  decorators: [tallDecorator],
  args: {
    back: {
      href: "/coach/plans",
      ariaLabel: "Back to plans",
    },
    header: <PageHeader title="Plan editor" description="Iterate on the draft plan." />,
  },
} satisfies Meta<typeof PageShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Scrollable: Story = {
  render: (args) => (
    <PageShell
      {...args}
      footer={
        <Button fullWidth={false} className="ml-auto">
          Save changes
        </Button>
      }
    >
      <div className="space-y-4">
        {Array.from({ length: 8 }, (_, index) => (
          <section
            key={index}
            className="rounded-card border border-glass-border bg-glass p-4 text-sm text-surface-muted"
          >
            Session block {index + 1}
          </section>
        ))}
      </div>
    </PageShell>
  ),
};

export const NonScrollable: Story = {
  args: {
    scrollable: false,
    back: undefined,
    header: undefined,
  },
  render: (args) => (
    <PageShell {...args}>
      <p className="text-sm text-surface-muted">Fixed layout shell without scroll chrome.</p>
    </PageShell>
  ),
};
