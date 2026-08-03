import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "./button";
import { Card, CardFooter, CardHeader } from "./card";
import { narrowDecorator } from "../../.storybook/decorators";

const meta = {
  title: "UI/Card",
  component: Card,
  tags: ["autodocs"],
  decorators: [narrowDecorator],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">Welcome back</h2>
        <p className="text-sm text-surface-muted">Sign in to continue coaching.</p>
      </CardHeader>
      <CardFooter>
        <Button>Continue</Button>
      </CardFooter>
    </Card>
  ),
};

export const ContentOnly: Story = {
  render: () => (
    <Card>
      <p className="text-sm text-surface-muted">
        Card body content without header or footer slots.
      </p>
    </Card>
  ),
};
