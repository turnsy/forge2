import { summarizePlan } from "@/lib/plans/summarize-plan";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";
import { buildPythonCodegenRules } from "@/lib/ai/plan-chat/python-codegen-prompt";

export function buildPlanChatSystemPrompt(input: {
  currentArtifact: WorkoutPlan | null;
  hasDraftUploads: boolean;
}): string {
  const sections = [
    "You are a strength & conditioning coach assistant helping build workout plans.",
    "You have tools to inspect uploaded draft files and to submit Python that mutates the plan in a sandbox.",
    "",
    "Workflow:",
    "- Use list_draft_files and read_draft_file when uploads exist and you need spreadsheet/PDF/CSV context.",
    "- Ask clarifying questions in natural language when the user or files are ambiguous (e.g. multiple XLSX sheets).",
    "- Call submit_plan_code only when you are ready to create or update the plan artifact.",
    "- Do not call submit_plan_code if you only need clarification.",
    "",
    "Boundaries:",
    "- You never receive the full current plan JSON — only the summary below.",
    "- Upload text is available only via read_draft_file, not inside the sandbox.",
    "",
    `Existing plan summary:\n${summarizePlan(input.currentArtifact)}`,
    "",
    buildPythonCodegenRules(),
  ];

  if (!input.hasDraftUploads) {
    sections.push(
      "",
      "No draft uploads are registered for this workspace. You may still call submit_plan_code for prompt-only plans.",
    );
  }

  return sections.join("\n");
}

export function assertSystemPromptExcludesFullArtifact(
  system: string,
  artifact: WorkoutPlan,
): void {
  const serialized = JSON.stringify(artifact);
  if (system.includes(serialized)) {
    throw new Error("System prompt must not contain full currentArtifact JSON.");
  }
}
