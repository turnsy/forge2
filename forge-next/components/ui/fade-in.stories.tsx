import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FadeIn } from "./fade-in";

const meta = {
  title: "UI/FadeIn",
  component: FadeIn,
  tags: ["autodocs"],
  args: {
    index: 0,
    children: "Content fades in on mount.",
  },
} satisfies Meta<typeof FadeIn>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Staggered: Story = {
  render: () => (
    <div className="space-y-2">
      {[0, 1, 2].map((index) => (
        <FadeIn key={index} index={index} className="rounded-md border border-glass-border p-3 text-sm">
          Item {index + 1}
        </FadeIn>
      ))}
    </div>
  ),
};
