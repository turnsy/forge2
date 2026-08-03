import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PlusIcon } from "@/components/icons/plus-icon";
import { IconButton } from "./icon-button";

const meta = {
  title: "UI/IconButton",
  component: IconButton,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "ghost", "plain", "dashed", "danger"],
    },
    size: { control: "select", options: ["sm", "md"] },
  },
  args: {
    "aria-label": "Add item",
    icon: <PlusIcon className="h-5 w-5" />,
    variant: "secondary",
    size: "md",
  },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Primary: Story = {
  args: { variant: "primary" },
};

export const Small: Story = {
  args: { size: "sm" },
};

export const Disabled: Story = {
  args: { disabled: true },
};
