import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Separator } from "./separator";
import { narrowDecorator } from "../../.storybook/decorators";

const meta = {
  title: "UI/Separator",
  component: Separator,
  tags: ["autodocs"],
  decorators: [narrowDecorator],
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="space-y-2 text-sm text-surface-muted">
      <p>Account settings</p>
      <Separator />
      <p>Notification preferences</p>
    </div>
  ),
};
