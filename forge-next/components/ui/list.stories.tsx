import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "./button";
import { MetaItem } from "./meta-item";
import { List, ListRow } from "./list";
import { wideDecorator } from "../../.storybook/decorators";

const meta = {
  title: "UI/List",
  component: List,
  tags: ["autodocs"],
  decorators: [wideDecorator],
} satisfies Meta<typeof List>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <List>
      <ListRow
        href="/coach/plans/1"
        leading={
          <div>
            <h3 className="font-semibold">Off-season strength</h3>
            <p className="text-sm text-surface-muted">Updated 2 days ago</p>
          </div>
        }
        meta={
          <>
            <MetaItem label="Athletes" value="12" />
            <MetaItem label="Status" value="Published" />
          </>
        }
        actions={
          <Button variant="secondary" size="sm" fullWidth={false}>
            Open
          </Button>
        }
      />
      <ListRow
        leading={
          <div>
            <h3 className="font-semibold">Pre-season conditioning</h3>
            <p className="text-sm text-surface-muted">Draft</p>
          </div>
        }
        meta={
          <>
            <MetaItem label="Athletes" value="0" />
            <MetaItem label="Status" value="Draft" />
          </>
        }
      />
    </List>
  ),
};
