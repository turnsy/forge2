import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Divider } from "./divider";
import { narrowDecorator } from "../../.storybook/decorators";

const meta = {
  title: "UI/Divider",
  component: Divider,
  tags: ["autodocs"],
  decorators: [narrowDecorator],
  args: {
    label: "or",
  },
} satisfies Meta<typeof Divider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CustomLabel: Story = {
  args: { label: "continue with" },
};
