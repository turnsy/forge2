import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AppearanceSelect } from "./appearance-select";
const meta = {
  title: "UI/AppearanceSelect",
  component: AppearanceSelect,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Persistent app preference. This control intentionally changes the preview document theme; use the toolbar to reset the story theme.",
      },
    },
  },
} satisfies Meta<typeof AppearanceSelect>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const CollapsedSidebar: Story = { args: { compact: true } };
