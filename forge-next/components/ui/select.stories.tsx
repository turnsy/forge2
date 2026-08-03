import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Select } from "./select";
import { narrowDecorator } from "../../.storybook/decorators";

const meta = {
  title: "UI/Select",
  component: Select,
  tags: ["autodocs"],
  decorators: [narrowDecorator],
  args: {
    children: (
      <>
        <option value="weekly">Weekly</option>
        <option value="monthly">Monthly</option>
        <option value="custom">Custom</option>
      </>
    ),
    defaultValue: "weekly",
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithLabel: Story = {
  args: {
    label: "Billing cycle",
  },
};

export const HiddenLabel: Story = {
  args: {
    label: "Sort by",
    hideLabel: true,
    size: "sm",
  },
};

export const Disabled: Story = {
  args: {
    label: "Plan type",
    disabled: true,
  },
};
