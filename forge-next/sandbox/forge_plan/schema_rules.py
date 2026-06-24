"""Human-readable validation rules aligned with workout-plan.schema.json v3.0.0."""

from __future__ import annotations

from forge_plan.ids import DAY_CODE_PATTERN

DAY_CODE_PATTERN_DESCRIPTION = (
    "lowercase `w` + week number + `d` + day number (regex: ^w[0-9]+d[0-9]+$)"
)
DAY_CODE_EXAMPLES_OK = ("w1d1", "w2d3", "w12d4")
DAY_CODE_EXAMPLES_BAD = ("W1D1", "w1D1", "W1d1", "week1-day1", "w1-d1")

REPS_PATTERN_DESCRIPTION = (
    "plain integer count (e.g. 5) — preferred; optional string like 3+1 for rep complexes only"
)
REPS_INVALID_EXAMPLES = (
    "3/side",
    "2x30s",
    "30s",
    "5/5",
    "1 (3 jumps)",
)
TARGET_UNITS_COMMON = ("kg", "lb", "m", "yd")
SET_STATUS_VALUES = ("planned", "completed", "skipped")


def validation_rules_cheat_sheet() -> str:
    """Return validation rules text for LLM cheat sheets and prompts."""
    return "\n".join(
        [
            "Schema validation rules (workout-plan.schema.json v3.0.0 — sandbox output must pass):",
            "",
            "Plan root:",
            '- schemaVersion must be exactly "3.0.0"',
            "- name: non-empty string (required)",
            "- weeks: array with at least 1 week for a valid saved plan",
            "",
            "Week:",
            "- days: at least 1 day per week",
            "",
            "Day:",
            f"- code: {DAY_CODE_PATTERN_DESCRIPTION}",
            f"  - OK: {', '.join(repr(x) for x in DAY_CODE_EXAMPLES_OK)}",
            f"  - Invalid: {', '.join(repr(x) for x in DAY_CODE_EXAMPLES_BAD)}",
            "- blocks: at least 1 block per day",
            "- day.code is assigned by forge_plan from array order (do not pass codes unless editing)",
            "",
            "Block:",
            "- id: non-empty string (auto-generated UUID when missing)",
            "- exercises: at least 1 exercise per block",
            "- 1 exercise = standalone work; 2+ exercises = superset",
            "",
            "Exercise:",
            "- id: non-empty string (required; auto-generated when missing)",
            "- name: non-empty string (required)",
            "- sets: at least 1 set per exercise",
            "",
            "Set (Exercise.add_set / add_sets build exact planned sets):",
            "- id: non-empty string (auto: {{day_code}}-{{exercise_slug}}-{{n}}, e.g. w1d1-bs-1)",
            '- planned.type: "exact" (builder) or "target" (hand-authored via SetRef.update_target)',
            f"- planned.reps: {REPS_PATTERN_DESCRIPTION}",
            "  - Use a plain integer for set reps (counts only).",
            "  - Do not put units, sides, ranges, or spreadsheet shorthand in reps "
            f"(invalid: {', '.join(repr(x) for x in REPS_INVALID_EXAMPLES)}).",
            '  - Put qualifiers in planned.notes — e.g. notes="per side", notes="30 sec".',
            "  - Optional: rep complexes as string 5+5+5 instead of int + notes when splitting reps matters.",
            "- planned.target:",
            "  - number (int/float) → absolute load: { type: \"absolute\", value, unit }",
            "  - string ending in % → percentage load: { type: \"percentage\", value, unit }",
            f'  - unit: non-empty string (common: {", ".join(TARGET_UNITS_COMMON)})',
            "- actual: null for new sets",
            f'- status: one of {", ".join(repr(s) for s in SET_STATUS_VALUES)} (builder uses "planned")',
            "- locked: boolean (builder uses false)",
            "",
            "forge_plan API conventions:",
            "- Build: Plan(name).add_week(Week().add_day(Day().add_exercise(...)))",
            "- add_exercise → 1-exercise block; add_superset(*exercises) → multi-exercise block",
            "- Exercise.add_set(reps=, target=, unit=) appends one set",
            "- Exercise.add_sets(reps=, target=, unit=, count=) appends identical sets (count required)",
            "- target: 50 → absolute; \"75%\" → percentage",
            "- Edit: plan.week(0).day(0).block(0).exercise(0).set(0).update(...)",
            "- day.exercise(0) also works (flat index across blocks)",
            "- All week/day/block/exercise/set indices are 0-based array positions",
            "- Call add_week → add_day → add_exercise/add_superset before add_set/add_sets on builders",
        ]
    ).strip()
