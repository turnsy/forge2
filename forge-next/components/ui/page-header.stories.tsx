import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "./button";
import { Pill } from "./pill";
import { PageHeader } from "./page-header";
import { wideDecorator } from "../../.storybook/decorators";

const meta = {
  title: "UI/PageHeader",
  component: PageHeader,
  tags: ["autodocs"],
  decorators: [wideDecorator],
  args: {
    title: "Training plans",
    description: "Create, iterate, and assign structured workout plans.",
  },
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithActions: Story = {
  args: {
    titleAddon: <Pill>Draft</Pill>,
    actions: (
      <Button size="sm" fullWidth={false}>
        New plan
      </Button>
    ),
  },
};
