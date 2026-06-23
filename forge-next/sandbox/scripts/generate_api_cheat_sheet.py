#!/usr/bin/env python3
"""Generate the forge_plan API cheat sheet for the plan-chat system prompt."""

from __future__ import annotations

import inspect
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from forge_plan import Plan, SupersetRef  # noqa: E402
from forge_plan.schema_rules import validation_rules_cheat_sheet  # noqa: E402

PUBLIC_METHODS = [
    "from_json_file",
    "empty",
    "is_empty",
    "add_week",
    "add_day",
    "add_exercise",
    "add_superset",
    "add_set",
    "move_week",
    "remove_week",
    "move_day",
    "remove_day",
    "move_exercise",
    "remove_exercise",
    "move_set",
    "remove_set",
    "write_json",
    "to_dict",
]


def _format_method(name: str, method: object) -> str:
    try:
        signature = str(inspect.signature(method))
    except (TypeError, ValueError):
        signature = "(...)"
    doc = inspect.getdoc(method) or ""
    summary = doc.split("\n", 1)[0].strip()
    return f"Plan.{name}{signature}\n  {summary}"


def _format_ref_method(class_name: str, name: str, method: object) -> str:
    try:
        signature = str(inspect.signature(method))
    except (TypeError, ValueError):
        signature = "(...)"
    doc = inspect.getdoc(method) or ""
    summary = doc.split("\n", 1)[0].strip()
    return f"{class_name}.{name}{signature}\n  {summary}"


def build_cheat_sheet() -> str:
    lines = [
        "forge_plan public API (use these names in submit_plan_code):",
        "",
    ]
    for name in PUBLIC_METHODS:
        method = getattr(Plan, name)
        lines.append(_format_method(name, method))
        lines.append("")

    lines.extend(
        [
            "SupersetRef (returned by Plan.add_superset):",
            "",
        ]
    )
    for name in ("add_exercise",):
        method = getattr(SupersetRef, name)
        lines.append(_format_ref_method("SupersetRef", name, method))
        lines.append("")

    lines.extend(
        [
            "",
            validation_rules_cheat_sheet(),
            "",
            "Example run.py (multi-week block — preferred pattern when user requests a full program):",
            "",
            "  from forge_plan import Plan",
            "",
            '  WEEKS = 4',
            "  DAYS_PER_WEEK = 4",
            '  DAY_NAMES = ["Lower", "Upper", "Full body", "Accessories"]',
            '  LIFT = "Back Squat"',
            "",
            '  plan = Plan.from_json_file("current_plan.json")',
            "  if plan.is_empty():",
            '      plan = Plan.empty("4-Week Strength")',
            "  for week in range(1, WEEKS + 1):",
            '      plan.add_week(label=f"Week {week}")',
            "      for day in range(1, DAYS_PER_WEEK + 1):",
            '          plan.add_day(week_index=week, name=DAY_NAMES[day - 1])',
            '          plan.add_exercise(week_index=week, day_index=day, name=LIFT)',
            "          plan.add_set(week_index=week, day_index=day, reps=5, load_value=100, unit=\"kg\")",
            '  plan.write_json("output/plan.json")',
            "",
            "Example run.py (minimal smoke test — not a full program):",
            "",
            "  from forge_plan import Plan",
            "",
            '  plan = Plan.from_json_file("current_plan.json")',
            "  if plan.is_empty():",
            '      plan = Plan.empty("Smoke test")',
            '  plan.add_week(label="Week 1")',
            '  plan.add_day(week_index=1, name="Day 1")',
            '  plan.add_exercise(week_index=1, day_index=1, name="Back Squat")',
            "  plan.add_set(week_index=1, day_index=1, reps=5, load_value=100, unit=\"kg\")",
            '  plan.write_json("output/plan.json")',
            "",
            "Example run.py (superset — use add_superset, not two separate add_exercise calls):",
            "",
            "  from forge_plan import Plan",
            "",
            '  plan = Plan.from_json_file("current_plan.json")',
            "  if plan.is_empty():",
            '      plan = Plan.empty("Superset Day")',
            '  plan.add_week(label="Week 1")',
            '  plan.add_day(week_index=1, name="Upper")',
            "  superset = plan.add_superset(1, 1, rounds=3, notes=\"Rest 90s between rounds\")",
            "  # Creates a superset block with 2 exercises, 3 sets each (default names Exercise A / B; coach renames in app)",
            "  superset.add_exercise(\"Face Pull\")  # optional: append a 3rd exercise with matching round count",
            '  plan.write_json("output/plan.json")',
            "",
            "Example run.py (reorder a day):",
            "",
            "  from forge_plan import Plan",
            "",
            '  plan = Plan.from_json_file("current_plan.json")',
            "  plan.move_day(week_index=1, from_index=0, to_index=1)",
            '  plan.write_json("output/plan.json")',
        ]
    )
    return "\n".join(lines).strip()


def main() -> None:
    cheat_sheet = build_cheat_sheet()
    out_ts = (
        ROOT.parent
        / "lib"
        / "ai"
        / "plan-chat"
        / "prompts"
        / "forge_plan_api_cheat_sheet.generated.ts"
    )
    out_ts.parent.mkdir(parents=True, exist_ok=True)
    out_ts.write_text(
        "/* AUTO-GENERATED — do not edit */\n\n"
        f"export const FORGE_PLAN_API_CHEAT_SHEET = {json.dumps(cheat_sheet)};\n",
        encoding="utf-8",
    )
    print(f"Wrote {out_ts} ({len(cheat_sheet.encode('utf-8'))} bytes)")


if __name__ == "__main__":
    main()
