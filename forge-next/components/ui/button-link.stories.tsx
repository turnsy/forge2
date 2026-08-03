import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ButtonLink } from "./button-link";
import { narrowDecorator } from "../../.storybook/decorators";

const meta = {
  title: "UI/ButtonLink",
  component: ButtonLink,
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
    href: "/coach/plans",
    children: "View plans",
    variant: "secondary",
    size: "sm",
  },
} satisfies Meta<typeof ButtonLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Primary: Story = {
  args: { variant: "primary", size: "md", children: "Get started" },
};
