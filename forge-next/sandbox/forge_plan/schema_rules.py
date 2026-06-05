"""Human-readable validation rules aligned with workout-plan.schema.json v2.0.0."""

from __future__ import annotations

# Keep in sync with forge_plan.builders.DAY_CODE_PATTERN and schemas/workout-plan.schema.json
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
LOAD_UNITS_ABSOLUTE = ("kg", "lb", "g")
PERCENTAGE_OPERATORS = ("exact", "range", "at-least", "at-most")
SET_STATUS_VALUES = ("planned", "completed", "skipped")


def validation_rules_cheat_sheet() -> str:
    """Return validation rules text for LLM cheat sheets and prompts."""
    return "\n".join(
        [
            "Schema validation rules (workout-plan.schema.json v2.0.0 — sandbox output must pass):",
            "",
            "Plan root:",
            '- schemaVersion must be exactly "2.0.0"',
            "- name: non-empty string (required)",
            "- weeks: array with at least 1 week for a valid saved plan",
            "",
            "Week:",
            "- index: integer >= 1 (schema index; forge_plan renumbers to match array order after each mutation)",
            "- days: at least 1 day per week",
            "",
            "Day:",
            "- index: integer >= 1",
            f"- code: {DAY_CODE_PATTERN_DESCRIPTION}",
            f"  - OK: {', '.join(repr(x) for x in DAY_CODE_EXAMPLES_OK)}",
            f"  - Invalid: {', '.join(repr(x) for x in DAY_CODE_EXAMPLES_BAD)}",
            "- exercises: at least 1 exercise per day",
            "- day.code and day.index are assigned by forge_plan from array order (do not pass codes to add_day)",
            "",
            "Exercise:",
            "- name: non-empty string (required)",
            "- sets: at least 1 set per exercise",
            "",
            "Set (forge_plan.add_set builds exact planned sets):",
            "- id: non-empty string (auto: {{day_code}}-{{exercise_slug}}-{{n}}, e.g. w1d1-bs-1)",
            '- planned.type: "exact" (builder) or "target" (hand-authored only)',
            f"- planned.reps: {REPS_PATTERN_DESCRIPTION}",
            "  - Use a plain integer for set reps (counts only).",
            "  - Do not put units, sides, ranges, or spreadsheet shorthand in reps "
            f"(invalid: {', '.join(repr(x) for x in REPS_INVALID_EXAMPLES)}).",
            '  - Put qualifiers in planned.notes via add_set(notes=...) — e.g. notes="per side", '
            'notes="30 sec", notes="each grip".',
            "  - Optional: rep complexes as string 5+5+5 instead of int + notes when splitting reps matters.",
            '- planned.notes: optional string on exact sets (use for per-side, time, and coaching detail)',
            '- planned.load: "absolute" OR "percentage"',
            f'  - absolute: type "absolute", value >= 0, unit one of {", ".join(LOAD_UNITS_ABSOLUTE)}',
            '  - percentage: type "percentage", unit "%", operator one of '
            f'{", ".join(repr(o) for o in PERCENTAGE_OPERATORS)}; '
            '"value" for exact/at-least/at-most; "minValue"+"maxValue" for range; "basis" optional',
            "- actual: null for new sets",
            f'- status: one of {", ".join(repr(s) for s in SET_STATUS_VALUES)} (builder uses "planned")',
            "- locked: boolean (builder uses false)",
            "",
            "forge_plan API conventions:",
            "- add_week() / add_day(): omit index to append; optional index upserts that slot",
            "- week_index / day_index on add_*: schema indices (1-based after sync), not 0-based array slots",
            "- move_* / remove_*: 0-based array positions within the parent list",
            "- add_set: set id/status/locked/actual are automatic; pass notes= for per-side/time/detail; "
            "omit exercise_index to target last exercise, or pass exercise_name",
            '- add_set load_type: only "absolute" or "percentage" (default absolute)',
            "- Call add_week → add_day → add_exercise → add_set in order for new content",
        ]
    ).strip()
