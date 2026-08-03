import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "./button";
import { EmptyState } from "./empty-state";
import { wideDecorator } from "../../.storybook/decorators";

const meta = {
  title: "UI/EmptyState",
  component: EmptyState,
  tags: ["autodocs"],
  decorators: [wideDecorator],
  args: {
    title: "No plans yet",
    description: "Create your first workout plan to share with athletes.",
  },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithAction: Story = {
  args: {
    action: <Button fullWidth={false}>Create plan</Button>,
  },
};
