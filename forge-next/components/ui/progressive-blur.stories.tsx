import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ProgressiveBlur } from "./progressive-blur";
import { tallDecorator } from "../../.storybook/decorators";

const meta = {
  title: "UI/ProgressiveBlur",
  component: ProgressiveBlur,
  tags: ["autodocs"],
  decorators: [tallDecorator],
  argTypes: {
    direction: { control: "select", options: ["top", "bottom"] },
  },
  args: {
    direction: "bottom",
    className: "absolute inset-x-0 bottom-0 h-24",
  },
} satisfies Meta<typeof ProgressiveBlur>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Bottom: Story = {
  render: (args) => (
    <div className="relative h-full overflow-hidden rounded-card border border-glass-border">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#27272a,#09090b)]" />
      <p className="relative z-10 p-6 text-sm text-surface-muted">
        Content scrolls beneath a progressive blur fade at the bottom edge.
      </p>
      <ProgressiveBlur {...args} />
    </div>
  ),
};

export const Top: Story = {
  args: {
    direction: "top",
    className: "absolute inset-x-0 top-0 h-24",
  },
  render: (args) => (
    <div className="relative h-full overflow-hidden rounded-card border border-glass-border">
      <div className="absolute inset-0 bg-[linear-gradient(0deg,#27272a,#09090b)]" />
      <p className="relative z-10 p-6 pt-16 text-sm text-surface-muted">
        Progressive blur fades content near the top edge.
      </p>
      <ProgressiveBlur {...args} />
    </div>
  ),
};
