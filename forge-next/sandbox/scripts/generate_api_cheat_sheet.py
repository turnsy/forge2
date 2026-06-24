#!/usr/bin/env python3
"""Generate the forge_plan API cheat sheet for the plan-chat system prompt."""

from __future__ import annotations

import inspect
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from forge_plan import Day, Exercise, Plan, Week  # noqa: E402
from forge_plan.plan import BlockRef, DayRef, ExerciseRef, SetRef, WeekRef  # noqa: E402
from forge_plan.schema_rules import validation_rules_cheat_sheet  # noqa: E402

BUILDER_CLASSES: list[type] = [Plan, Week, Day, Exercise]
REF_CLASSES: list[type] = [WeekRef, DayRef, BlockRef, ExerciseRef, SetRef]


def _format_callable(owner: str, name: str, method: object) -> str:
    try:
        signature = str(inspect.signature(method))
    except (TypeError, ValueError):
        signature = "(...)"
    doc = inspect.getdoc(method) or ""
    summary = doc.split("\n", 1)[0].strip() if doc else ""
    return f"{owner}.{name}{signature}\n  {summary}"


def _iter_public_methods(cls: type) -> list[tuple[str, object]]:
    items: list[tuple[str, object]] = []
    for name, member in inspect.getmembers(cls):
        if name.startswith("_") and name != "__init__":
            continue
        if inspect.isfunction(member) or inspect.ismethoddescriptor(member):
            items.append((name, getattr(cls, name)))
            continue
        static = inspect.getattr_static(cls, name, None)
        if isinstance(static, classmethod):
            items.append((name, static.__func__))
    return items


def build_cheat_sheet() -> str:
    lines = [
        "forge_plan public API (use these names in submit_plan_code):",
        "",
        "Builders (create plans):",
        "",
    ]

    for cls in BUILDER_CLASSES:
        for name, member in _iter_public_methods(cls):
            if cls is Plan and name not in {
                "__init__",
                "from_json_file",
                "empty",
                "from_dict",
                "is_empty",
                "add_week",
                "week",
                "to_dict",
                "write_json",
            }:
                continue
            if cls is Week and name != "add_day":
                continue
            if cls is Day and name not in {"add_exercise", "add_superset"}:
                continue
            if cls is Exercise and name not in {"add_set", "add_sets"}:
                continue
            owner = cls.__name__
            lines.append(_format_callable(owner, name, member))
            lines.append("")

    lines.extend(["Navigation + edits (0-based indices):", ""])
    for cls in REF_CLASSES:
        for name, member in _iter_public_methods(cls):
            if name == "__init__":
                continue
            lines.append(_format_callable(cls.__name__, name, member))
            lines.append("")

    lines.extend(
        [
            validation_rules_cheat_sheet(),
            "",
            "Example run.py (fluent build — preferred for new plans):",
            "",
            "  from forge_plan import Plan, Week, Day, Exercise",
            "",
            '  plan = Plan("1 week bench").add_week(',
            "      Week(label=\"Week 1\").add_day(",
            "          Day(name=\"Upper\")",
            "          .add_exercise(Exercise(\"Bench press\").add_sets(reps=5, target=50, unit=\"kg\", count=3))",
            "          .add_superset(",
            "              Exercise(\"Bench press\").add_sets(reps=10, target=30, unit=\"kg\", count=3),",
            "              Exercise(\"Incline bench\").add_sets(reps=10, target=20, unit=\"kg\", count=3),",
            "          )",
            "      )",
            "  )",
            '  plan.write_json("output/plan.json")',
            "",
            "Example run.py (iterate existing plan):",
            "",
            "  from forge_plan import Plan",
            "",
            '  plan = Plan.from_json_file("current_plan.json")',
            "  if plan.is_empty():",
            '      plan = Plan("Strength block").add_week(...)',
            "  plan.week(0).day(0).block(0).exercise(0).set(0).update(reps=6, target=55, unit=\"kg\")",
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
