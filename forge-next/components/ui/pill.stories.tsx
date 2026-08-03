import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Pill } from "./pill";

const meta = {
  title: "UI/Pill",
  component: Pill,
  tags: ["autodocs"],
  argTypes: {
    tone: { control: "select", options: ["default", "danger"] },
  },
  args: {
    children: "Draft",
    tone: "default",
  },
} satisfies Meta<typeof Pill>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Danger: Story = {
  args: { tone: "danger", children: "Archived" },
};

export const AsLink: Story = {
  args: { href: "/coach/plans/1", children: "View plan" },
};
