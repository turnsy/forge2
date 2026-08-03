import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Accordion, AccordionItem } from "./accordion";
import { wideDecorator } from "../../.storybook/decorators";

const meta = {
  title: "UI/Accordion",
  component: Accordion,
  tags: ["autodocs"],
  decorators: [wideDecorator],
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Accordion>
      <AccordionItem
        title={<h3 className="font-semibold">Week 1 — Base building</h3>}
        description={
          <p className="text-sm text-surface-muted">3 sessions · 45 min average</p>
        }
        meta={<span className="text-sm text-surface-muted">Draft</span>}
      >
        <p className="text-sm text-surface-muted">
          Lower-body strength on Monday, conditioning on Wednesday, and active recovery on Friday.
        </p>
      </AccordionItem>
      <AccordionItem
        title={<h3 className="font-semibold">Week 2 — Progression</h3>}
        defaultOpen
      >
        <p className="text-sm text-surface-muted">
          Increase load by 5% while keeping the same session structure.
        </p>
      </AccordionItem>
    </Accordion>
  ),
};

export const NestedVariant: Story = {
  render: () => (
    <Accordion>
      <AccordionItem
        variant="nested"
        title={<h3 className="font-semibold">Session A</h3>}
        defaultOpen
      >
        <p className="text-sm text-surface-muted">Warm-up, main lifts, and cooldown notes.</p>
      </AccordionItem>
    </Accordion>
  ),
};
