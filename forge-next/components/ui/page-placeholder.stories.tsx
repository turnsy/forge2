import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PagePlaceholder } from "./page-placeholder";
import { tallDecorator } from "../../.storybook/decorators";

const meta = {
  title: "UI/PagePlaceholder",
  component: PagePlaceholder,
  tags: ["autodocs"],
  decorators: [tallDecorator],
  args: {
    title: "Athlete dashboard",
  },
} satisfies Meta<typeof PagePlaceholder>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
