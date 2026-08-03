import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SubmitButton } from "./submit-button";
import { narrowDecorator } from "../../.storybook/decorators";

const meta = {
  title: "UI/SubmitButton",
  component: SubmitButton,
  tags: ["autodocs"],
  decorators: [
    narrowDecorator,
    (Story) => (
      <form action={() => undefined}>
        <Story />
      </form>
    ),
  ],
  args: {
    children: "Sign in",
    pendingLabel: "Signing in…",
  },
} satisfies Meta<typeof SubmitButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Secondary: Story = {
  args: { variant: "secondary", children: "Save draft" },
};

export const Disabled: Story = {
  args: { disabled: true },
};
