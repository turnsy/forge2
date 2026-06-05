#!/usr/bin/env python3
"""Generate the forge_plan API cheat sheet for the plan-chat system prompt."""

from __future__ import annotations

import inspect
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from forge_plan import Plan  # noqa: E402

PUBLIC_METHODS = [
    "from_json_file",
    "empty",
    "is_empty",
    "add_week",
    "add_day",
    "add_exercise",
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
            "load_type for add_set: 'absolute' (value + unit) or 'percentage' (load_value = percent, operator defaults to 'exact'; basis omitted in JSON).",
            "",
            "move_* / remove_* use 0-based array positions. add_* week_index / day_index use schema indices (renumbered to match array order after every mutation).",
            "",
            "Example run.py (minimal create):",
            "",
            "  from forge_plan import Plan",
            "",
            '  plan = Plan.from_json_file("current_plan.json")',
            "  if plan.is_empty():",
            '      plan = Plan.empty("4-Week Strength")',
            '  plan.add_week(index=1, label="Week 1")',
            '  plan.add_day(week_index=1, index=1, code="w1d1", name="Lower")',
            '  plan.add_exercise(week_index=1, day_index=1, name="Back Squat")',
            '  plan.add_set(1, 1, 0, reps=5, load_type="absolute", load_value=100, unit="kg")',
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
    out_path = (
        ROOT.parent
        / "lib"
        / "ai"
        / "plan-chat"
        / "prompts"
        / "forge_plan_api_cheat_sheet.txt"
    )
    cheat_sheet = build_cheat_sheet()
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(cheat_sheet + "\n", encoding="utf-8")
    print(f"Wrote {out_path} ({len(cheat_sheet.encode('utf-8'))} bytes)")


if __name__ == "__main__":
    main()
