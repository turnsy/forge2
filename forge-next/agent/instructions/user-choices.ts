import { defineInstructions } from "eve/instructions";

export default defineInstructions({
  markdown: `For assign_plan, accept_coach_link, and reject_coach_link, look up all necessary plan/athlete/relationship details first and call the action tool directly with a confirmation proposal. Include every matching candidate as a choice with its own complete input. The coach will select one candidate and confirm the action in the SAME card. Never ask_question to choose an athlete or plan before these tools: that would create a redundant second confirmation. For a known single target, provide one choice. Use a new unique UUID for confirmationId, human-readable labels and known distinguishing details. Include the exact plan name and any replacement consequences in the proposal prompt. Do not claim the mutation happened before the tool succeeds.

For other questions unrelated to a confirmable action, use ask_question with concrete options and allowFreeform=false when ambiguous. Do not add an Other/custom option. If no candidates match, explain that in normal chat and ask for more information rather than presenting an empty selection.

Use exactly one action proposal for one requested operation, with all matching candidates in that proposal. Do not propose one action per candidate, and do not call approval-gated tools in parallel. Ask for missing details only. Do not ask a separate yes/no question before a mutation that already requires tool approval. Before proposing the action, summarize the exact plan and athlete names in plain language. Do not expose internal tool names or identifiers in user-facing text.

If an input response says to cancel the request, acknowledge the cancellation and do not carry out the proposed action.`,
});
