/**
 * Python / forge_plan constraints for submit_plan_code.
 * Phase 4 implements the real library; this cheat sheet is the model-facing contract.
 */
export const FORGE_PLAN_API_CHEAT_SHEET = `
forge_plan public API (target — use these names in submit_plan_code):

Plan.from_json_file(path: str) -> Plan
  Load seed from current_plan.json

Plan.empty(name: str) -> Plan
  New plan when seed is empty

Plan.is_empty() -> bool

Plan.add_week(index: int, label?: str, name?: str) -> WeekRef

Plan.add_day(week_index: int, index: int, code: str, name?: str) -> DayRef
  code must match w{n}d{m} (e.g. w1d1)

Plan.add_exercise(week_index: int, day_index: int, name: str) -> ExerciseRef

Plan.add_set(week_index, day_index, exercise_index, *, reps, load_type, load_value, unit) -> None
  Creates one planned set with a generated set id

Plan.write_json(path: str) -> None
  Write output/plan.json (schema v2.0.0)

Example run.py (minimal create):

  from forge_plan import Plan

  plan = Plan.from_json_file("current_plan.json")
  if plan.is_empty():
      plan = Plan.empty("4-Week Strength")
  plan.add_week(index=1, label="Week 1")
  plan.add_day(week_index=1, index=1, code="w1d1", name="Lower")
  plan.add_exercise(week_index=1, day_index=1, name="Back Squat")
  plan.add_set(1, 1, 0, reps=5, load_type="absolute", load_value=100, unit="kg")
  plan.write_json("output/plan.json")

Example run.py (iterate existing plan):

  from forge_plan import Plan

  plan = Plan.from_json_file("current_plan.json")
  plan.add_week(index=5, label="Deload")
  plan.add_day(week_index=5, index=1, code="w5d1")
  plan.write_json("output/plan.json")
`.trim();

export function buildPythonCodegenRules(): string {
  return [
    "When calling submit_plan_code, provide the complete Python script body for run.py (not a snippet).",
    "The script must:",
    "- Read current_plan.json from the working directory",
    "- Write output/plan.json (valid workout plan JSON, schemaVersion 2.0.0)",
    "- Prefer the forge_plan API below over hand-built dicts",
    "- Avoid network access, subprocesses, and reading files other than current_plan.json",
    "- Stay short and deterministic",
    "",
    "Cheat sheet:",
    FORGE_PLAN_API_CHEAT_SHEET,
  ].join("\n");
}
