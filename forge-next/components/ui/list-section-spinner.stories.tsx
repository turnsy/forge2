import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ListSectionSpinner } from "./list-section-spinner";
import { wideDecorator } from "../../.storybook/decorators";

const meta = {
  title: "UI/ListSectionSpinner",
  component: ListSectionSpinner,
  tags: ["autodocs"],
  decorators: [wideDecorator],
} satisfies Meta<typeof ListSectionSpinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
