import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PlusIcon } from "@/components/icons/plus-icon";
import { Button } from "./button";
import { narrowDecorator } from "../../.storybook/decorators";

const meta = {
  title: "UI/Button",
  component: Button,
  tags: ["autodocs"],
  decorators: [narrowDecorator],
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "ghost", "plain", "dashed", "danger"],
    },
    size: { control: "select", options: ["sm", "md"] },
  },
  args: {
    children: "Continue",
    fullWidth: true,
    variant: "primary",
    size: "md",
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const Secondary: Story = {
  args: { variant: "secondary" },
};

export const Ghost: Story = {
  args: { variant: "ghost" },
};

export const Dashed: Story = {
  args: { variant: "dashed", children: "Add item" },
};

export const Danger: Story = {
  args: { variant: "danger", children: "Delete" },
};

export const WithIcon: Story = {
  args: {
    icon: <PlusIcon />,
    children: "Create plan",
  },
};

export const Compact: Story = {
  args: {
    size: "sm",
    fullWidth: false,
    children: "Save",
  },
};

export const Disabled: Story = {
  args: { disabled: true },
};
