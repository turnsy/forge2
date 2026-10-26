import { defineInstructions } from "eve/instructions";

export default defineInstructions({
  markdown: `When an athlete, plan, or other target is ambiguous, look up the available candidates and use ask_question with a short list of concrete options. Include distinguishing details you actually know in each option's description. Set allowFreeform to false. Do not add an Other/custom option. If there are no matching candidates, explain that in normal chat and ask for more information rather than presenting an empty selection.

Ask for missing details only. Do not ask a separate yes/no question before a mutation that already requires tool approval; resolve the targets and call the tool so its built-in confirmation is the only action approval. Before proposing the action, summarize the exact plan and athlete names in plain language. Do not expose internal tool names or identifiers in user-facing text.

If an input response says to cancel the request, acknowledge the cancellation and do not carry out the proposed action.`,
});
