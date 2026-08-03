import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ChatBubble } from "./chat-bubble";
import { wideDecorator } from "../../.storybook/decorators";

const meta = {
  title: "UI/ChatBubble",
  component: ChatBubble,
  tags: ["autodocs"],
  decorators: [wideDecorator],
  argTypes: {
    role: { control: "select", options: ["user", "assistant"] },
  },
  args: {
    role: "user",
    children: "Can you add a deload week before the meet?",
  },
} satisfies Meta<typeof ChatBubble>;

export default meta;
type Story = StoryObj<typeof meta>;

export const User: Story = {};

export const Assistant: Story = {
  args: {
    role: "assistant",
    children: "Added a deload week with reduced volume and intensity.",
  },
};

export const Streaming: Story = {
  args: {
    role: "assistant",
    isStreaming: true,
    children: "Generating plan updates",
  },
};

export const Conversation: Story = {
  render: () => (
    <div className="space-y-3">
      <ChatBubble role="user">Build a 4-week strength block.</ChatBubble>
      <ChatBubble role="assistant">
        Here is a progressive overload structure with weekly volume targets.
      </ChatBubble>
    </div>
  ),
};
