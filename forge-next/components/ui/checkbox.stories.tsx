import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { Checkbox } from "./checkbox";

const meta = {
  title: "UI/Checkbox",
  component: Checkbox,
  tags: ["autodocs"],
  args: {
    checked: false,
    "aria-label": "Accept terms",
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unchecked: Story = {};

export const Checked: Story = {
  args: { checked: true },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const Interactive: Story = {
  render: () => {
    const [checked, setChecked] = useState(false);

    return (
      <label className="inline-flex items-center gap-3 text-sm">
        <Checkbox
          checked={checked}
          onChange={setChecked}
          aria-label="Send weekly summary"
        />
        Send weekly summary
      </label>
    );
  },
};
