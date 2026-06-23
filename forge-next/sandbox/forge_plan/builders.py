"""Low-level helpers for workout plan JSON (schema v2.0.0)."""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

SCHEMA_VERSION = "2.1.0"
DAY_CODE_PATTERN = re.compile(r"^w[0-9]+d[0-9]+$")


def format_day_code(week_number: int, day_number: int) -> str:
    """Build schema day code from 1-based week and day numbers (e.g. w1d1)."""
    return f"w{week_number}d{day_number}"


def empty_plan_template() -> dict[str, Any]:
    """Return an in-memory empty seed (not valid output until weeks are added)."""
    return {"schemaVersion": SCHEMA_VERSION, "name": "", "weeks": []}


def load_seed_from_file(path: str) -> dict[str, Any]:
    """Load plan seed from JSON file; use empty template when missing or invalid."""
    file_path = Path(path)
    if not file_path.is_file():
        return empty_plan_template()

    try:
        raw = json.loads(file_path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return empty_plan_template()

    if not isinstance(raw, dict):
        return empty_plan_template()

    if raw.get("schemaVersion") not in (SCHEMA_VERSION, "2.0.0"):
        return empty_plan_template()

    weeks = raw.get("weeks")
    if not isinstance(weeks, list):
        raw["weeks"] = []
    return raw


def exercise_slug(name: str) -> str:
    """Build a short slug from an exercise name (e.g. Back Squat -> bs)."""
    parts = re.findall(r"[A-Za-z0-9]+", name)
    if not parts:
        return "ex"
    if len(parts) == 1:
        token = parts[0]
        return token[:2].lower() if len(token) >= 2 else token.lower()
    return "".join(word[0].lower() for word in parts[:4])


def next_set_id(day_code: str, exercise_name: str, existing_sets: list[dict[str, Any]]) -> str:
    """Generate a unique set id within a day/exercise (e.g. w1d1-bs-1)."""
    slug = exercise_slug(exercise_name)
    prefix = f"{day_code}-{slug}-"
    max_index = 0
    for item in existing_sets:
        set_id = item.get("id")
        if isinstance(set_id, str) and set_id.startswith(prefix):
            suffix = set_id[len(prefix) :]
            if suffix.isdigit():
                max_index = max(max_index, int(suffix))
    return f"{prefix}{max_index + 1}"


def build_absolute_load(value: float, unit: str) -> dict[str, Any]:
    """Build an absolute load object."""
    return {"type": "absolute", "value": value, "unit": unit}


def build_percentage_load(
    value: float,
    *,
    unit: str = "kg",
) -> dict[str, Any]:
    """Build a percentage load."""
    return {
        "type": "percentage",
        "value": value,
        "unit": unit.strip() or "kg",
    }


def build_planned_set(
    *,
    reps: int | str,
    load_type: str,
    load_value: float,
    unit: str = "kg",
    notes: str | None = None,
) -> dict[str, Any]:
    """Build a minimal exact planned set (absolute or percentage load).

    Prefer integer ``reps``. Use ``notes`` for per-side, time, and other qualifiers.
    Schema also allows rep-complex strings matching ``^[0-9]+(?:\\+[0-9]+)*$``.
    """
    if load_type == "absolute":
        load = build_absolute_load(load_value, unit)
    elif load_type == "percentage":
        load = build_percentage_load(load_value, unit=unit)
    else:
        raise ValueError("load_type must be 'absolute' or 'percentage'")

    planned: dict[str, Any] = {
        "type": "exact",
        "reps": reps,
        "load": load,
    }
    if notes:
        planned["notes"] = notes
    return planned


def build_set_entry(
    *,
    set_id: str,
    reps: int | str,
    load_type: str,
    load_value: float,
    unit: str = "kg",
    notes: str | None = None,
) -> dict[str, Any]:
    """Build a full set entry for the workout plan schema."""
    return {
        "id": set_id,
        "planned": build_planned_set(
            reps=reps,
            load_type=load_type,
            load_value=load_value,
            unit=unit,
            notes=notes,
        ),
        "actual": None,
        "status": "planned",
        "locked": False,
    }


def validate_day_code(code: str) -> None:
    """Raise ValueError when day code does not match schema pattern ``^w[0-9]+d[0-9]+$``.

    Codes must use a **lowercase** ``w`` and ``d`` (e.g. ``w1d1``). Uppercase
    letters such as ``W1D1`` fail validation and JSON Schema checks.
    """
    if not DAY_CODE_PATTERN.match(code):
        raise ValueError(
            f"day code must match w{{n}}d{{m}} (lowercase w and d), got {code!r}"
        )


def create_exercise(name: str, *, sets: list[dict[str, Any]] | None = None) -> dict[str, Any]:
    """Build an exercise object (name + sets) for use in supersets or hand assembly."""
    if not name.strip():
        raise ValueError("exercise name must be non-empty")
    return {"name": name, "sets": list(sets) if sets is not None else []}


def create_superset(
    *exercises: dict[str, Any],
    notes: str | None = None,
) -> dict[str, Any]:
    """Build a superset block from exercise objects created with create_exercise."""
    if len(exercises) < 2:
        raise ValueError("superset requires at least 2 exercises")
    block: dict[str, Any] = {"type": "superset", "exercises": list(exercises)}
    if notes is not None:
        block["notes"] = notes
    return block


def move_list_item(items: list[Any], from_index: int, to_index: int) -> None:
    """Move an item within a list (0-based indices; ``to_index`` is insert position)."""
    if from_index < 0 or from_index >= len(items):
        raise ValueError(f"from_index {from_index} out of range (0..{len(items) - 1})")
    item = items.pop(from_index)
    if to_index < 0:
        to_index = 0
    if to_index > len(items):
        to_index = len(items)
    items.insert(to_index, item)
