"""Fluent builders and JSON materialization for workout-plan schema v3."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from forge_plan.ids import new_id, next_set_id
from forge_plan.target import parse_target

SCHEMA_VERSION = "3.0.0"


class Exercise:
    """Builder for one exercise and its planned sets."""

    def __init__(
        self,
        name: str,
        *,
        exercise_id: str | None = None,
        notes: str | None = None,
        video_url: str | None = None,
    ) -> None:
        self._name = name.strip()
        if not self._name:
            raise ValueError("exercise name must be non-empty")
        self._exercise_id = exercise_id
        self._notes = notes
        self._video_url = video_url
        self._set_specs: list[dict[str, Any]] = []

    @property
    def name(self) -> str:
        return self._name

    def add_set(
        self,
        *,
        reps: int | str,
        target: int | float | str,
        unit: str = "kg",
        notes: str | None = None,
    ) -> Exercise:
        self._set_specs.append(
            {
                "reps": reps,
                "target": target,
                "unit": unit,
                "notes": notes,
                "count": 1,
            }
        )
        return self

    def add_sets(
        self,
        *,
        reps: int | str,
        target: int | float | str,
        unit: str = "kg",
        count: int,
        notes: str | None = None,
    ) -> Exercise:
        if count < 1:
            raise ValueError("count must be >= 1")
        self._set_specs.append(
            {
                "reps": reps,
                "target": target,
                "unit": unit,
                "notes": notes,
                "count": count,
            }
        )
        return self


class Block:
    """Internal block builder (single exercise or superset)."""

    def __init__(
        self,
        *,
        exercises: list[Exercise],
        label: str | None = None,
        notes: str | None = None,
        block_id: str | None = None,
    ) -> None:
        if len(exercises) < 1:
            raise ValueError("block requires at least one exercise")
        self._exercises = exercises
        self._label = label
        self._notes = notes
        self._block_id = block_id


class Day:
    """Builder for a training day."""

    def __init__(
        self,
        name: str | None = None,
        *,
        code: str | None = None,
        notes: str | None = None,
    ) -> None:
        self._name = name
        self._code = code
        self._notes = notes
        self._blocks: list[Block] = []

    def add_exercise(self, exercise: Exercise) -> Day:
        self._blocks.append(Block(exercises=[exercise]))
        return self

    def add_superset(self, *exercises: Exercise, label: str | None = None) -> Day:
        if len(exercises) < 2:
            raise ValueError("add_superset requires at least two exercises")
        self._blocks.append(Block(exercises=list(exercises), label=label))
        return self

    def add_block(self, block: Block) -> Day:
        self._blocks.append(block)
        return self


class Week:
    """Builder for a plan week."""

    def __init__(
        self,
        label: str | None = None,
        *,
        name: str | None = None,
        notes: str | None = None,
    ) -> None:
        self._label = label
        self._name = name
        self._notes = notes
        self._days: list[Day] = []

    def add_day(self, day: Day) -> Week:
        self._days.append(day)
        return self


def empty_plan_template(name: str = "") -> dict[str, Any]:
    return {"schemaVersion": SCHEMA_VERSION, "name": name, "weeks": []}


def load_seed_from_file(path: str) -> dict[str, Any]:
    file_path = Path(path)
    if not file_path.is_file():
        return empty_plan_template()

    try:
        raw = json.loads(file_path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return empty_plan_template()

    if not isinstance(raw, dict):
        return empty_plan_template()

    if raw.get("schemaVersion") != SCHEMA_VERSION:
        return empty_plan_template()

    weeks = raw.get("weeks")
    if not isinstance(weeks, list):
        raw["weeks"] = []
    return raw


def move_list_item(items: list[Any], from_index: int, to_index: int) -> None:
    if from_index < 0 or from_index >= len(items):
        raise ValueError(f"from_index {from_index} out of range (0..{len(items) - 1})")
    item = items.pop(from_index)
    if to_index < 0:
        to_index = 0
    if to_index > len(items):
        to_index = len(items)
    items.insert(to_index, item)


def build_set_entry(
    *,
    set_id: str,
    reps: int | str,
    target: int | float | str,
    unit: str,
    notes: str | None = None,
) -> dict[str, Any]:
    planned: dict[str, Any] = {
        "type": "exact",
        "reps": reps,
        "target": parse_target(target, unit),
    }
    if notes:
        planned["notes"] = notes

    return {
        "id": set_id,
        "planned": planned,
        "actual": None,
        "status": "planned",
        "locked": False,
    }


def materialize_exercise(exercise: Exercise, day_code: str) -> dict[str, Any]:
    exercise_dict: dict[str, Any] = {
        "id": exercise._exercise_id or new_id(),
        "name": exercise._name,
        "sets": [],
    }
    if exercise._notes:
        exercise_dict["notes"] = exercise._notes
    if exercise._video_url:
        exercise_dict["videoUrl"] = exercise._video_url

    sets: list[dict[str, Any]] = []
    for spec in exercise._set_specs:
        count = int(spec["count"])
        for _ in range(count):
            set_id = next_set_id(day_code, exercise._name, sets)
            sets.append(
                build_set_entry(
                    set_id=set_id,
                    reps=spec["reps"],
                    target=spec["target"],
                    unit=spec["unit"],
                    notes=spec.get("notes"),
                )
            )

    if len(sets) == 0:
        raise ValueError(f'exercise {exercise._name!r} has no sets; call add_set or add_sets')

    exercise_dict["sets"] = sets
    return exercise_dict


def materialize_block(block: Block, day_code: str) -> dict[str, Any]:
    block_dict: dict[str, Any] = {
        "id": block._block_id or new_id(),
        "exercises": [materialize_exercise(exercise, day_code) for exercise in block._exercises],
    }
    if block._label:
        block_dict["label"] = block._label
    if block._notes:
        block_dict["notes"] = block._notes
    return block_dict


def materialize_day(day: Day) -> dict[str, Any]:
    if len(day._blocks) == 0:
        raise ValueError("day has no blocks; add at least one exercise")

    day_dict: dict[str, Any] = {
        "code": day._code or "w0d0",
        "blocks": [],
    }
    if day._name:
        day_dict["name"] = day._name
    if day._notes:
        day_dict["notes"] = day._notes

    placeholder_code = day_dict["code"]
    day_dict["blocks"] = [materialize_block(block, placeholder_code) for block in day._blocks]
    return day_dict


def materialize_week(week: Week) -> dict[str, Any]:
    if len(week._days) == 0:
        raise ValueError("week has no days; call add_day first")

    week_dict: dict[str, Any] = {"days": [materialize_day(day) for day in week._days]}
    if week._label:
        week_dict["label"] = week._label
    if week._name:
        week_dict["name"] = week._name
    if week._notes:
        week_dict["notes"] = week._notes
    return week_dict
