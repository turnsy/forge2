import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { Radio } from "./radio";

const meta = {
  title: "UI/Radio",
  component: Radio,
  tags: ["autodocs"],
  args: {
    checked: false,
    name: "plan-visibility",
    "aria-label": "Public plan",
  },
} satisfies Meta<typeof Radio>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unchecked: Story = {};

export const Checked: Story = {
  args: { checked: true },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const Group: Story = {
  render: () => {
    const [value, setValue] = useState<"private" | "team">("private");

    return (
      <fieldset className="space-y-3 text-sm">
        <legend className="mb-2 font-medium">Visibility</legend>
        <label className="flex items-center gap-3">
          <Radio
            name="visibility"
            checked={value === "private"}
            onChange={() => setValue("private")}
            aria-label="Private"
          />
          Private
        </label>
        <label className="flex items-center gap-3">
          <Radio
            name="visibility"
            checked={value === "team"}
            onChange={() => setValue("team")}
            aria-label="Team"
          />
          Team
        </label>
      </fieldset>
    );
  },
};
