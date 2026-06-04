/**
 * Python / forge_plan constraints for submit_plan_code (cheat sheet expanded in Phase 4).
 */
export const FORGE_PLAN_API_CHEAT_SHEET = `
forge_plan (v1 stub — Phase 4 expands):
- Read seed: json.load(open("current_plan.json"))
- Write output: json.dump(plan_dict, open("output/plan.json", "w"))
- Plan must match workout-plan schema v2.0.0 (schemaVersion, name, weeks with days/exercises/sets)
`.trim();

export function buildPythonCodegenRules(): string {
  return [
    "When calling submit_plan_code, provide the full Python script body for run.py.",
    "The script must:",
    "- Read current_plan.json from the working directory",
    "- Write output/plan.json (valid workout plan JSON)",
    "- Use only the forge_plan public API where possible (see cheat sheet)",
    "- Avoid network access, subprocesses, and reading files other than current_plan.json",
    "- Stay short and deterministic",
    "",
    "Cheat sheet:",
    FORGE_PLAN_API_CHEAT_SHEET,
  ].join("\n");
}
