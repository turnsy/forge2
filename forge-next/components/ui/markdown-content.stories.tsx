import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MarkdownContent } from "./markdown-content";
import { wideDecorator } from "../../.storybook/decorators";

const sampleMarkdown = `# Weekly focus

Train **full-body strength** three times per week.

- Squat pattern
- Hinge pattern
- Push / pull balance

\`\`\`
Week 1: RPE 7
Week 2: RPE 7.5
\`\`\`

> Keep rest periods between 2–3 minutes on main lifts.

| Day | Focus |
| --- | --- |
| Mon | Lower |
| Wed | Upper |
| Fri | Full body |
`;

const meta = {
  title: "UI/MarkdownContent",
  component: MarkdownContent,
  tags: ["autodocs"],
  decorators: [wideDecorator],
  args: {
    content: sampleMarkdown,
  },
} satisfies Meta<typeof MarkdownContent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const InlineFormatting: Story = {
  args: {
    content: "Use `loadWorkoutPlan()` to validate generated artifacts before publishing.",
  },
};
