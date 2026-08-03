import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Input } from "./input";
import { narrowDecorator } from "../../.storybook/decorators";

const meta = {
  title: "UI/Input",
  component: Input,
  tags: ["autodocs"],
  decorators: [narrowDecorator],
  args: {
    placeholder: "Email address",
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithLabel: Story = {
  args: {
    label: "Email",
    placeholder: "you@example.com",
    type: "email",
  },
};

export const Small: Story = {
  args: { size: "sm", label: "Search", placeholder: "Find athlete…" },
};

export const Disabled: Story = {
  args: { label: "Email", disabled: true, value: "coach@forge.app" },
};
