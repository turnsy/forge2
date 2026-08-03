import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { PillButton } from "./pill-button";

const meta = {
  title: "UI/PillButton",
  component: PillButton,
  tags: ["autodocs"],
  args: {
    children: "Strength",
  },
} satisfies Meta<typeof PillButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unselected: Story = {};

export const Selected: Story = {
  args: { selected: true },
};

export const ToggleGroup: Story = {
  render: () => {
    const [selected, setSelected] = useState("strength");

    return (
      <div className="flex flex-wrap gap-2">
        {["strength", "conditioning", "mobility"].map((option) => (
          <PillButton
            key={option}
            selected={selected === option}
            onClick={() => setSelected(option)}
          >
            {option.charAt(0).toUpperCase() + option.slice(1)}
          </PillButton>
        ))}
      </div>
    );
  },
};
