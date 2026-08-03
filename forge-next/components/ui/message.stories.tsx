import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Message } from "./message";
import { narrowDecorator } from "../../.storybook/decorators";

const meta = {
  title: "UI/Message",
  component: Message,
  tags: ["autodocs"],
  decorators: [narrowDecorator],
  argTypes: {
    tone: { control: "select", options: ["error", "success", "info"] },
  },
  args: {
    tone: "info",
    children: "Your plan draft was saved.",
  },
} satisfies Meta<typeof Message>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Info: Story = {};

export const Success: Story = {
  args: {
    tone: "success",
    children: "Athlete invited successfully.",
  },
};

export const Error: Story = {
  args: {
    tone: "error",
    children: "We could not save your changes. Try again.",
  },
};
