import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "./button";
import { ErrorState } from "./error-state";
import { wideDecorator } from "../../.storybook/decorators";

const meta = {
  title: "UI/ErrorState",
  component: ErrorState,
  tags: ["autodocs"],
  decorators: [wideDecorator],
  args: {
    title: "Something went wrong",
    description: "We could not load this page. Check your connection and try again.",
  },
} satisfies Meta<typeof ErrorState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithDetails: Story = {
  args: {
    details: (
      <pre className="overflow-x-auto rounded-md bg-black/20 p-3 font-mono text-xs">
        Error: PLAN_NOT_FOUND (404)
      </pre>
    ),
  },
};

export const WithAction: Story = {
  args: {
    action: (
      <Button variant="secondary" fullWidth={false}>
        Retry
      </Button>
    ),
  },
};
