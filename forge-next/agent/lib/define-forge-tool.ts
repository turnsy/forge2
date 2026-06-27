import { defineTool, type ToolDefinition } from "eve/tools";
import { withForgeDbContextAsync } from "./with-forge-db";

export function defineForgeTool<TInput, TOutput>(
  definition: ToolDefinition<TInput, TOutput>,
): ToolDefinition<TInput, TOutput> {
  const execute = definition.execute;

  return defineTool({
    ...definition,
    async execute(input, ctx) {
      return withForgeDbContextAsync(ctx, () => execute(input, ctx));
    },
  });
}
