import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ForgeLogo } from "@/components/forge-logo";
import { Button } from "./button";
import { Input } from "./input";
import { Pill } from "./pill";
import { Tab, TabList, TabPanel, Tabs } from "./tabs";
import { glassSurfaceClass, messageToneClass } from "@/lib/theme";

function DesignSystem() {
  return (
    <main className="forge-canvas mx-auto max-w-6xl space-y-16 px-2 py-8 sm:px-8">
      <header className="flex items-center justify-between border-b border-surface-divider pb-6">
        <ForgeLogo variant="horizontal" size="sidebar" />
        <span className="text-xs tracking-widest text-surface-muted uppercase">
          Design language / 01
        </span>
      </header>
      <section className="grid gap-8 md:grid-cols-[1.5fr_1fr] md:items-end">
        <div>
          <p className="mb-5 text-xs font-medium tracking-widest text-coach uppercase">
            Quiet by design.
          </p>
          <h1 className="max-w-xl text-5xl leading-[1.08] font-medium tracking-[-0.05em] sm:text-7xl">
            Space for
            <br />
            stronger work.
          </h1>
        </div>
        <p className="max-w-sm text-base leading-7 text-surface-muted">
          A considered workspace for coaches and athletes. Mineral tones,
          precise typography, and light moving through glass. Nothing competing
          with the work.
        </p>
      </section>
      <section className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className={`${glassSurfaceClass()} space-y-8 p-6 sm:p-8`}>
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs tracking-widest text-surface-muted uppercase">
              Your workspace
            </span>
            <Pill>Week 04</Pill>
          </div>
          <div>
            <h2 className="text-3xl font-medium tracking-tight">
              Build with intention.
            </h2>
            <p className="mt-2 text-sm text-surface-muted">
              Small steps. Measurable progress.
            </p>
          </div>
          <Tabs defaultTab="overview">
            <TabList>
              <Tab id="overview">Overview</Tab>
              <Tab id="sessions">Sessions</Tab>
              <Tab id="notes">Notes</Tab>
            </TabList>
            <TabPanel id="overview">
              <div className="grid grid-cols-3 gap-4 py-5">
                {[
                  ["12", "Athletes"],
                  ["08", "Active plans"],
                  ["94%", "Completion"],
                ].map(([value, label]) => (
                  <div key={label}>
                    <p className="text-3xl font-medium tracking-tight tabular-nums">
                      {value}
                    </p>
                    <p className="mt-2 text-xs text-surface-muted">{label}</p>
                  </div>
                ))}
              </div>
            </TabPanel>
            <TabPanel id="sessions">
              <p className="py-5 text-sm text-surface-muted">
                Three sessions this week. Room to recover.
              </p>
            </TabPanel>
            <TabPanel id="notes">
              <p className="py-5 text-sm text-surface-muted">
                Keep the effort consistent. Let the results follow.
              </p>
            </TabPanel>
          </Tabs>
          <div className="flex flex-wrap gap-3">
            <Button fullWidth={false}>
              Create a plan{" "}
              <svg
                aria-hidden="true"
                className="ml-4 h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M7 17 17 7M7 7h10v10" />
              </svg>
            </Button>
            <Button variant="ghost" fullWidth={false}>
              View athletes
            </Button>
          </div>
        </div>
        <div
          className={`${glassSurfaceClass()} flex flex-col justify-between gap-8 p-6 sm:p-8`}
        >
          <div>
            <p className="text-xs tracking-widest text-surface-muted uppercase">
              A fresh start
            </p>
            <h2 className="mt-5 text-2xl font-medium tracking-tight">
              Good work starts here.
            </h2>
          </div>
          <div className="space-y-4">
            <Input label="Plan name" placeholder="e.g. Foundation / Block 01" />
            <Input
              label="Coach email"
              type="email"
              placeholder="you@studio.com"
            />
            <Button>Continue</Button>
            <p className="text-center text-xs text-surface-muted">
              A little structure. A lot of possibility.
            </p>
          </div>
        </div>
      </section>
      <section className="space-y-6">
        <SectionLabel number="01" title="Palette & material" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            ["Canvas", "bg-surface"],
            ["Elevated", "bg-surface-elevated"],
            ["Liquid Glass", "bg-glass backdrop-blur-md"],
            ["Primary", "bg-glass-primary text-glass-primary-foreground"],
          ].map(([name, style]) => (
            <div
              key={name}
              className={`flex h-32 items-end rounded-card border border-glass-border p-4 text-sm ${style}`}
            >
              {name}
            </div>
          ))}
        </div>
        <p className="max-w-2xl text-sm leading-6 text-surface-muted">
          Use glass for structure and controls. Keep content legible with opaque
          ink. Nest surfaces sparingly; let whitespace create hierarchy.
        </p>
      </section>
      <section className="space-y-6">
        <SectionLabel number="02" title="Actions & feedback" />
        <div className="flex flex-wrap gap-3">
          {(
            [
              "primary",
              "secondary",
              "ghost",
              "plain",
              "dashed",
              "danger",
            ] as const
          ).map((variant) => (
            <Button key={variant} variant={variant} fullWidth={false}>
              {variant.charAt(0).toUpperCase() + variant.slice(1)}
            </Button>
          ))}
          <Button disabled fullWidth={false}>
            Unavailable
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <p className={messageToneClass("success")}>
            Plan saved. Ready when you are.
          </p>
          <p className={messageToneClass("info")}>
            Your next session is tomorrow.
          </p>
          <p className={messageToneClass("error")}>
            Couldn’t save. Please try again.
          </p>
        </div>
      </section>
      <section className="space-y-6">
        <SectionLabel number="03" title="Type & rhythm" />
        <div className="grid gap-8 border-t border-surface-divider pt-8 sm:grid-cols-2">
          <div>
            <p className="text-4xl font-medium tracking-tight">
              Less, with purpose.
            </p>
            <p className="mt-4 max-w-sm text-sm leading-6 text-surface-muted">
              Geist. Clear at every size. Medium weight for hierarchy, regular
              for reading. A four-point spacing rhythm keeps everything
              connected.
            </p>
          </div>
          <div className="flex items-end gap-4">
            {[4, 8, 12, 16, 24, 32, 48].map((size) => (
              <div
                key={size}
                className="flex flex-col items-center gap-3 text-xs text-surface-muted"
              >
                <div
                  className="rounded bg-coach/30"
                  style={{ width: size, height: size }}
                />
                {size}
              </div>
            ))}
          </div>
        </div>
      </section>
      <footer className="border-t border-surface-divider pt-6 text-xs text-surface-muted">
        Forge / Built for the long game. Switch Light / Dark in the toolbar to
        explore.
      </footer>
    </main>
  );
}
function SectionLabel({ number, title }: { number: string; title: string }) {
  return (
    <h2 className="text-xs font-medium tracking-widest uppercase">
      <span className="mr-4 text-surface-muted">{number}</span>
      {title}
    </h2>
  );
}
const meta = {
  title: "Design System/Overview",
  component: DesignSystem,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof DesignSystem>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Overview: Story = {};
