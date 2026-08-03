import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "./button";
import { ActionGroup } from "./action-group";
import { wideDecorator } from "../../.storybook/decorators";

const meta = {
  title: "UI/ActionGroup",
  component: ActionGroup,
  tags: ["autodocs"],
  decorators: [wideDecorator],
} satisfies Meta<typeof ActionGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <ActionGroup>
      <Button variant="secondary" fullWidth={false}>
        Cancel
      </Button>
      <Button fullWidth={false}>Save plan</Button>
    </ActionGroup>
  ),
};
