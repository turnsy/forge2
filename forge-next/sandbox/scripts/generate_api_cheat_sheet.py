#!/usr/bin/env python3
"""Generate a compact forge_plan API cheat sheet for the plan-chat system prompt."""

from __future__ import annotations

import inspect
import sys
from pathlib import Path

MAX_BYTES = 2048
TRUNCATION_NOTE = "\n… (truncated — see forge_plan for more)\n"

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from forge_plan import Plan  # noqa: E402


def _format_method(name: str, method: object) -> str:
    try:
        signature = str(inspect.signature(method))
    except (TypeError, ValueError):
        signature = "(...)"
    doc = inspect.getdoc(method) or ""
    summary = doc.split("\n", 1)[0].strip()
    return f"{name}{signature}\n  {summary}"


def build_cheat_sheet() -> str:
    lines = [
        "forge_plan public API (use these names in submit_plan_code):",
        "",
        _format_method("Plan.from_json_file", Plan.from_json_file),
        "",
        _format_method("Plan.empty", Plan.empty),
        "",
        _format_method("Plan.is_empty", Plan.is_empty),
        "",
        _format_method("Plan.add_week", Plan.add_week),
        "",
        _format_method("Plan.add_day", Plan.add_day),
        "",
        _format_method("Plan.add_exercise", Plan.add_exercise),
        "",
        _format_method("Plan.add_set", Plan.add_set),
        "",
        _format_method("Plan.write_json", Plan.write_json),
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
    ]
    return "\n".join(lines).strip()


def truncate_to_limit(text: str, limit: int = MAX_BYTES) -> str:
    encoded = text.encode("utf-8")
    if len(encoded) <= limit:
        return text

    note = TRUNCATION_NOTE.encode("utf-8")
    budget = limit - len(note)
    trimmed = encoded[:budget].decode("utf-8", errors="ignore")
    if "\n" in trimmed:
        trimmed = trimmed.rsplit("\n", 1)[0]
    return trimmed.rstrip() + TRUNCATION_NOTE.strip()


def main() -> None:
    out_path = (
        ROOT.parent
        / "lib"
        / "ai"
        / "plan-chat"
        / "prompts"
        / "forge_plan_api_cheat_sheet.txt"
    )
    cheat_sheet = truncate_to_limit(build_cheat_sheet())
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(cheat_sheet + "\n", encoding="utf-8")
    print(f"Wrote {out_path} ({len(cheat_sheet.encode('utf-8'))} bytes)")


if __name__ == "__main__":
    main()
