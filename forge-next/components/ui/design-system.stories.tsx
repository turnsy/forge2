import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { PlusIcon } from "@/components/icons/plus-icon";
import { Accordion, AccordionItem } from "./accordion";
import { Button } from "./button";
import { Card, CardFooter, CardHeader } from "./card";
import { ChatBubble } from "./chat-bubble";
import { Checkbox } from "./checkbox";
import { Divider } from "./divider";
import { EmptyState } from "./empty-state";
import { ErrorState } from "./error-state";
import { Input } from "./input";
import { Message } from "./message";
import { MetaItem } from "./meta-item";
import { Pill } from "./pill";
import { PillButton } from "./pill-button";
import { Radio } from "./radio";
import { Select } from "./select";
import { Separator } from "./separator";
import { Tab, TabList, TabPanel, Tabs } from "./tabs";
import { wideDecorator } from "../../.storybook/decorators";

function DesignSystemOverview() {
  const [checked, setChecked] = useState(true);
  const [selectedPill, setSelectedPill] = useState("strength");

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-10">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-surface-foreground">Forge UI</h1>
        <p className="text-sm text-surface-muted">
          Shared glass surfaces, semantic feedback tones, and consistent control sizing.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-surface-foreground">Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Button fullWidth={false}>Primary</Button>
          <Button variant="secondary" fullWidth={false}>
            Secondary
          </Button>
          <Button variant="ghost" fullWidth={false}>
            Ghost
          </Button>
          <Button variant="dashed" fullWidth={false}>
            Dashed
          </Button>
          <Button variant="danger" fullWidth={false}>
            Danger
          </Button>
          <Button fullWidth={false} size="sm" icon={<PlusIcon />}>
            With icon
          </Button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-surface-foreground">Form controls</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Email" placeholder="you@example.com" />
          <Select label="Plan type" defaultValue="strength">
            <option value="strength">Strength</option>
            <option value="conditioning">Conditioning</option>
          </Select>
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <label className="inline-flex items-center gap-3 text-sm">
            <Checkbox checked={checked} onChange={setChecked} aria-label="Weekly summary" />
            Weekly summary
          </label>
          <label className="inline-flex items-center gap-3 text-sm">
            <Radio checked name="visibility" aria-label="Private" />
            Private
          </label>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-surface-foreground">Chips & feedback</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Pill>Draft</Pill>
          <Pill tone="danger">Archived</Pill>
          {["strength", "conditioning", "mobility"].map((option) => (
            <PillButton
              key={option}
              selected={selectedPill === option}
              onClick={() => setSelectedPill(option)}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </PillButton>
          ))}
        </div>
        <div className="grid gap-3">
          <Message tone="info">Draft saved in memory.</Message>
          <Message tone="success">Plan validated successfully.</Message>
          <Message tone="error">Validation failed — review the schema errors.</Message>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-surface-foreground">Surfaces</h2>
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Card surface</h3>
            <p className="text-sm text-surface-muted">Glass panel with shared border and blur.</p>
          </CardHeader>
          <CardFooter>
            <Button size="sm">Continue</Button>
          </CardFooter>
        </Card>
        <Accordion>
          <AccordionItem
            title={<h3 className="font-semibold">Accordion item</h3>}
            defaultOpen
          >
            <p className="text-sm text-surface-muted">Nested content uses the same list-row surface.</p>
          </AccordionItem>
        </Accordion>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-surface-foreground">Navigation & structure</h2>
        <Tabs defaultTab="overview">
          <TabList>
            <Tab id="overview">Overview</Tab>
            <Tab id="sessions">Sessions</Tab>
          </TabList>
          <TabPanel id="overview">
            <p className="text-sm text-surface-muted">Tab panels share divider and focus styling.</p>
          </TabPanel>
          <TabPanel id="sessions">
            <p className="text-sm text-surface-muted">Session breakdown and progression.</p>
          </TabPanel>
        </Tabs>
        <Divider />
        <div className="space-y-2 text-sm text-surface-muted">
          <p>Section one</p>
          <Separator />
          <p>Section two</p>
        </div>
        <dl className="grid gap-4 sm:grid-cols-3">
          <MetaItem label="Duration" value="45 min" />
          <MetaItem label="Sessions" value="3 / week" />
          <MetaItem label="Status" value="Published" />
        </dl>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-surface-foreground">States & chat</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <EmptyState
            title="No plans yet"
            description="Create your first workout plan."
            action={
              <Button fullWidth={false} size="sm">
                Create plan
              </Button>
            }
          />
          <ErrorState
            title="Could not load plans"
            description="Check your connection and try again."
            action={
              <Button variant="secondary" fullWidth={false} size="sm">
                Retry
              </Button>
            }
          />
        </div>
        <div className="space-y-3 rounded-card border border-glass-border bg-glass p-4">
          <ChatBubble role="user">Add a deload week before the meet.</ChatBubble>
          <ChatBubble role="assistant">
            Added a deload week with reduced volume and intensity.
          </ChatBubble>
        </div>
      </section>
    </div>
  );
}

const meta = {
  title: "Design System/Overview",
  component: DesignSystemOverview,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [wideDecorator],
} satisfies Meta<typeof DesignSystemOverview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllPrimitives: Story = {
  render: () => <DesignSystemOverview />,
};
