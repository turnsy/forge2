"""Workout plan builder and refs for workout-plan.schema.json v3."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from forge_plan.builders import (
    SCHEMA_VERSION,
    Day,
    Exercise,
    Week,
    build_set_entry,
    empty_plan_template,
    load_seed_from_file,
    materialize_day,
    materialize_week,
    move_list_item,
)
from forge_plan.ids import format_day_code, new_id, next_set_id
from forge_plan.paths import OUTPUT_PATH, SEED_PATH
from forge_plan.target import parse_target


class SetRef:
    """Handle to one set inside a plan."""

    def __init__(
        self,
        plan: Plan,
        week_pos: int,
        day_pos: int,
        block_pos: int,
        exercise_pos: int,
        set_pos: int,
    ) -> None:
        self._plan = plan
        self._week_pos = week_pos
        self._day_pos = day_pos
        self._block_pos = block_pos
        self._exercise_pos = exercise_pos
        self._set_pos = set_pos

    def update(
        self,
        *,
        reps: int | str | None = None,
        target: int | float | str | None = None,
        unit: str | None = None,
        notes: str | None = None,
        status: str | None = None,
        locked: bool | None = None,
    ) -> SetRef:
        set_entry = self._require_set()
        planned = set_entry.setdefault("planned", {})
        if planned.get("type") != "exact":
            raise ValueError("only exact planned sets support update(); use update_target for instructional sets")

        if reps is not None:
            planned["reps"] = reps
        if target is not None:
            current_unit = unit
            if current_unit is None:
                existing_target = planned.get("target")
                if not isinstance(existing_target, dict):
                    raise ValueError("unit is required when updating target on a set without an existing target")
                current_unit = str(existing_target.get("unit", "kg"))
            planned["target"] = parse_target(target, current_unit)
        elif unit is not None:
            existing_target = planned.get("target")
            if not isinstance(existing_target, dict):
                raise ValueError("cannot update unit without an existing target")
            value = existing_target.get("value")
            target_type = existing_target.get("type")
            if target_type == "absolute":
                planned["target"] = parse_target(float(value), unit)
            elif target_type == "percentage":
                planned["target"] = parse_target(f"{value}%", unit)
            else:
                raise ValueError("cannot update unit on set without a valid target")

        if notes is not None:
            planned["notes"] = notes or None
            if planned["notes"] is None:
                planned.pop("notes", None)

        if status is not None:
            set_entry["status"] = status
        if locked is not None:
            set_entry["locked"] = locked

        self._plan._sync()
        return self

    def update_target(
        self,
        *,
        instruction: str,
        reps: int | str | None = None,
        target: int | float | str | None = None,
        unit: str | None = None,
        notes: str | None = None,
    ) -> SetRef:
        set_entry = self._require_set()
        planned: dict[str, Any] = {
            "type": "target",
            "instruction": instruction,
        }
        if reps is not None:
            planned["reps"] = reps
        if target is not None:
            planned["target"] = parse_target(target, unit or "kg")
        if notes is not None:
            planned["notes"] = notes
        set_entry["planned"] = planned
        self._plan._sync()
        return self

    def remove(self) -> None:
        sets = self._require_sets_list()
        if len(sets) <= 1:
            raise ValueError("exercise must keep at least one set")
        sets.pop(self._set_pos)
        self._plan._sync()

    def move(self, to_index: int) -> None:
        sets = self._require_sets_list()
        move_list_item(sets, self._set_pos, to_index)
        self._plan._sync()

    def _require_set(self) -> dict[str, Any]:
        return self._require_sets_list()[self._set_pos]

    def _require_sets_list(self) -> list[dict[str, Any]]:
        exercise = ExerciseRef(
            self._plan,
            self._week_pos,
            self._day_pos,
            self._block_pos,
            self._exercise_pos,
        )._require_exercise()
        sets = exercise.get("sets")
        if not isinstance(sets, list):
            raise ValueError("exercise has no sets")
        return sets


class ExerciseRef:
    """Handle to one exercise inside a plan."""

    def __init__(
        self,
        plan: Plan,
        week_pos: int,
        day_pos: int,
        block_pos: int,
        exercise_pos: int,
    ) -> None:
        self._plan = plan
        self._week_pos = week_pos
        self._day_pos = day_pos
        self._block_pos = block_pos
        self._exercise_pos = exercise_pos

    def set(self, set_pos: int) -> SetRef:
        return SetRef(
            self._plan,
            self._week_pos,
            self._day_pos,
            self._block_pos,
            self._exercise_pos,
            set_pos,
        )

    def add_set(
        self,
        *,
        reps: int | str,
        target: int | float | str,
        unit: str = "kg",
        notes: str | None = None,
    ) -> ExerciseRef:
        return self._append_sets(reps=reps, target=target, unit=unit, notes=notes, count=1)

    def add_sets(
        self,
        *,
        reps: int | str,
        target: int | float | str,
        unit: str = "kg",
        count: int,
        notes: str | None = None,
    ) -> ExerciseRef:
        if count < 1:
            raise ValueError("count must be >= 1")
        return self._append_sets(reps=reps, target=target, unit=unit, notes=notes, count=count)

    def update(
        self,
        *,
        name: str | None = None,
        notes: str | None = None,
        video_url: str | None = None,
    ) -> ExerciseRef:
        exercise = self._require_exercise()
        if name is not None:
            exercise["name"] = name
        if notes is not None:
            if notes:
                exercise["notes"] = notes
            else:
                exercise.pop("notes", None)
        if video_url is not None:
            if video_url:
                exercise["videoUrl"] = video_url
            else:
                exercise.pop("videoUrl", None)
        self._plan._sync()
        return self

    def remove(self) -> None:
        block = self._plan.week(self._week_pos).day(self._day_pos).block(self._block_pos)
        exercises = block._require_block()["exercises"]
        if len(exercises) <= 1:
            block.remove()
            return
        exercises.pop(self._exercise_pos)
        self._plan._sync()

    def move(self, to_index: int) -> None:
        exercises = self._require_block_exercises()
        move_list_item(exercises, self._exercise_pos, to_index)
        self._plan._sync()

    def _append_sets(
        self,
        *,
        reps: int | str,
        target: int | float | str,
        unit: str,
        notes: str | None,
        count: int,
    ) -> ExerciseRef:
        exercise = self._require_exercise()
        sets = exercise.setdefault("sets", [])
        day_code = self._plan.week(self._week_pos).day(self._day_pos)._require_day()["code"]
        exercise_name = str(exercise["name"])
        for _ in range(count):
            set_id = next_set_id(day_code, exercise_name, sets)
            sets.append(
                build_set_entry(
                    set_id=set_id,
                    reps=reps,
                    target=target,
                    unit=unit,
                    notes=notes,
                )
            )
        self._plan._sync()
        return self

    def _require_exercise(self) -> dict[str, Any]:
        exercises = self._require_block_exercises()
        if self._exercise_pos < 0 or self._exercise_pos >= len(exercises):
            raise ValueError(f"exercise index {self._exercise_pos} out of range")
        return exercises[self._exercise_pos]

    def _require_block_exercises(self) -> list[dict[str, Any]]:
        block = self._plan.week(self._week_pos).day(self._day_pos).block(self._block_pos)
        return block._require_block()["exercises"]


class BlockRef:
    """Handle to one block inside a day."""

    def __init__(self, plan: Plan, week_pos: int, day_pos: int, block_pos: int) -> None:
        self._plan = plan
        self._week_pos = week_pos
        self._day_pos = day_pos
        self._block_pos = block_pos

    def exercise(self, exercise_pos: int) -> ExerciseRef:
        return ExerciseRef(self._plan, self._week_pos, self._day_pos, self._block_pos, exercise_pos)

    def update(self, *, label: str | None = None, notes: str | None = None) -> BlockRef:
        block = self._require_block()
        if label is not None:
            if label:
                block["label"] = label
            else:
                block.pop("label", None)
        if notes is not None:
            if notes:
                block["notes"] = notes
            else:
                block.pop("notes", None)
        self._plan._sync()
        return self

    def remove(self) -> None:
        blocks = self._require_blocks_list()
        if len(blocks) <= 1:
            raise ValueError("day must keep at least one block")
        blocks.pop(self._block_pos)
        self._plan._sync()

    def move(self, to_index: int) -> None:
        blocks = self._require_blocks_list()
        move_list_item(blocks, self._block_pos, to_index)
        self._plan._sync()

    def _require_block(self) -> dict[str, Any]:
        return self._require_blocks_list()[self._block_pos]

    def _require_blocks_list(self) -> list[dict[str, Any]]:
        return self._plan.week(self._week_pos).day(self._day_pos)._require_blocks_list()


class DayRef:
    """Handle to one day inside a plan."""

    def __init__(self, plan: Plan, week_pos: int, day_pos: int) -> None:
        self._plan = plan
        self._week_pos = week_pos
        self._day_pos = day_pos

    def block(self, block_pos: int) -> BlockRef:
        return BlockRef(self._plan, self._week_pos, self._day_pos, block_pos)

    def exercise(self, flat_exercise_pos: int) -> ExerciseRef:
        block_pos, exercise_pos = self._resolve_flat_exercise_pos(flat_exercise_pos)
        return ExerciseRef(self._plan, self._week_pos, self._day_pos, block_pos, exercise_pos)

    def add_exercise(self, exercise: Exercise) -> DayRef:
        from forge_plan.builders import Block, materialize_block

        day = self._require_day()
        day_code = str(day.get("code", "w0d0"))
        blocks = day.setdefault("blocks", [])
        blocks.append(materialize_block(Block(exercises=[exercise]), day_code))
        self._plan._sync()
        return self

    def add_superset(self, *exercises: Exercise, label: str | None = None) -> DayRef:
        from forge_plan.builders import Block, materialize_block

        if len(exercises) < 2:
            raise ValueError("add_superset requires at least two exercises")
        day = self._require_day()
        day_code = str(day.get("code", "w0d0"))
        blocks = day.setdefault("blocks", [])
        blocks.append(materialize_block(Block(exercises=list(exercises), label=label), day_code))
        self._plan._sync()
        return self

    def update(self, *, name: str | None = None, notes: str | None = None) -> DayRef:
        day = self._require_day()
        if name is not None:
            if name:
                day["name"] = name
            else:
                day.pop("name", None)
        if notes is not None:
            if notes:
                day["notes"] = notes
            else:
                day.pop("notes", None)
        self._plan._sync()
        return self

    def remove(self) -> None:
        days = self._require_days_list()
        if len(days) <= 1:
            raise ValueError("week must keep at least one day")
        days.pop(self._day_pos)
        self._plan._sync()

    def move(self, to_index: int) -> None:
        days = self._require_days_list()
        move_list_item(days, self._day_pos, to_index)
        self._plan._sync()

    def _resolve_flat_exercise_pos(self, flat_exercise_pos: int) -> tuple[int, int]:
        if flat_exercise_pos < 0:
            raise ValueError(f"exercise index {flat_exercise_pos} out of range")
        offset = 0
        for block_pos, block in enumerate(self._require_blocks_list()):
            exercises = block.get("exercises")
            if not isinstance(exercises, list):
                continue
            if flat_exercise_pos < offset + len(exercises):
                return block_pos, flat_exercise_pos - offset
            offset += len(exercises)
        raise ValueError(f"exercise index {flat_exercise_pos} out of range")

    def _require_day(self) -> dict[str, Any]:
        return self._require_days_list()[self._day_pos]

    def _require_days_list(self) -> list[dict[str, Any]]:
        return self._plan.week(self._week_pos)._require_week()["days"]

    def _require_blocks_list(self) -> list[dict[str, Any]]:
        blocks = self._require_day().get("blocks")
        if not isinstance(blocks, list):
            raise ValueError("day has no blocks")
        return blocks


class WeekRef:
    """Handle to one week inside a plan."""

    def __init__(self, plan: Plan, week_pos: int) -> None:
        self._plan = plan
        self._week_pos = week_pos

    def day(self, day_pos: int) -> DayRef:
        return DayRef(self._plan, self._week_pos, day_pos)

    def add_day(self, day: Day) -> WeekRef:
        week = self._require_week()
        days = week.setdefault("days", [])
        days.append(materialize_day(day))
        self._plan._sync()
        return self

    def update(self, *, label: str | None = None, name: str | None = None, notes: str | None = None) -> WeekRef:
        week = self._require_week()
        if label is not None:
            if label:
                week["label"] = label
            else:
                week.pop("label", None)
        if name is not None:
            if name:
                week["name"] = name
            else:
                week.pop("name", None)
        if notes is not None:
            if notes:
                week["notes"] = notes
            else:
                week.pop("notes", None)
        self._plan._sync()
        return self

    def remove(self) -> None:
        weeks = self._plan._ensure_weeks()
        if len(weeks) <= 1:
            raise ValueError("plan must keep at least one week")
        weeks.pop(self._week_pos)
        self._plan._sync()

    def move(self, to_index: int) -> None:
        weeks = self._plan._ensure_weeks()
        move_list_item(weeks, self._week_pos, to_index)
        self._plan._sync()

    def _require_week(self) -> dict[str, Any]:
        weeks = self._plan._ensure_weeks()
        if self._week_pos < 0 or self._week_pos >= len(weeks):
            raise ValueError(f"week index {self._week_pos} out of range")
        return weeks[self._week_pos]


class Plan:
    """Mutable workout plan builder for schema v3."""

    def __init__(self, name: str | None = None, data: dict[str, Any] | None = None) -> None:
        """Create a plan builder. Pass ``name`` for fluent ``Plan("title").add_week(...)``."""
        if data is not None:
            self._data = data
        elif name is not None:
            self._data = empty_plan_template(name)
        else:
            self._data = empty_plan_template()

    @classmethod
    def from_dict(cls, value: dict[str, Any]) -> Plan:
        """Wrap an existing v3 plan dict."""
        if value.get("schemaVersion") != SCHEMA_VERSION:
            raise ValueError(f"expected schemaVersion {SCHEMA_VERSION}")
        return cls(data=dict(value))

    @classmethod
    def empty(cls, name: str) -> Plan:
        """Create a new named plan with no weeks."""
        return cls(name=name)

    @classmethod
    def load(cls) -> Plan:
        """Load ``current_plan.json`` or return an empty template when missing/invalid."""
        seed = load_seed_from_file(SEED_PATH)
        return cls(data=seed)

    def is_empty(self) -> bool:
        """True when the plan has no weeks."""
        weeks = self._data.get("weeks")
        return not isinstance(weeks, list) or len(weeks) == 0

    def add_week(self, week: Week) -> Plan:
        """Append a built week. Returns ``self`` for chaining."""
        weeks = self._ensure_weeks()
        weeks.append(materialize_week(week))
        self._sync()
        return self

    def week(self, week_pos: int) -> WeekRef:
        """Return a handle to a week by 0-based array position."""
        return WeekRef(self, week_pos)

    def to_dict(self) -> dict[str, Any]:
        """Return JSON-serializable plan data (schema v3.1.0)."""
        return dict(self._data)

    def save(self) -> None:
        """Write plan JSON to ``output/plan.json``."""
        target = Path(OUTPUT_PATH)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(
            json.dumps(self.to_dict(), indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )

    def _ensure_weeks(self) -> list[dict[str, Any]]:
        weeks = self._data.get("weeks")
        if not isinstance(weeks, list):
            weeks = []
            self._data["weeks"] = weeks
        return weeks

    def _sync(self) -> None:
        weeks = self._ensure_weeks()
        for week_pos, week in enumerate(weeks):
            week_number = week_pos + 1
            days = week.get("days")
            if not isinstance(days, list):
                week["days"] = []
                continue
            for day_pos, day in enumerate(days):
                day_number = day_pos + 1
                day_code = format_day_code(week_number, day_number)
                day["code"] = day_code

                blocks = day.get("blocks")
                if not isinstance(blocks, list):
                    day["blocks"] = []
                    continue

                for block in blocks:
                    if not block.get("id"):
                        block["id"] = new_id()

                    exercises = block.get("exercises")
                    if not isinstance(exercises, list):
                        block["exercises"] = []
                        continue

                    for exercise in exercises:
                        if not exercise.get("id"):
                            exercise["id"] = new_id()

                        sets = exercise.get("sets")
                        if not isinstance(sets, list):
                            exercise["sets"] = []
                            continue

                        exercise_name = str(exercise.get("name", "exercise"))
                        for set_pos, set_entry in enumerate(sets):
                            if not set_entry.get("id"):
                                set_entry["id"] = next_set_id(day_code, exercise_name, sets[:set_pos])
                            set_entry.setdefault("actual", None)
                            set_entry.setdefault("status", "planned")
                            set_entry.setdefault("locked", False)


def summarize(plan: Plan | dict[str, Any]) -> str:
    """Return a short human-readable summary for sandbox debug prints."""
    data = plan.to_dict() if isinstance(plan, Plan) else plan
    weeks = data.get("weeks") if isinstance(data, dict) else []
    if not isinstance(weeks, list) or len(weeks) == 0:
        return "empty plan"

    day_count = 0
    block_count = 0
    exercise_count = 0
    set_count = 0
    for week in weeks:
        days = week.get("days") if isinstance(week, dict) else []
        if not isinstance(days, list):
            continue
        day_count += len(days)
        for day in days:
            blocks = day.get("blocks") if isinstance(day, dict) else []
            if not isinstance(blocks, list):
                continue
            block_count += len(blocks)
            for block in blocks:
                exercises = block.get("exercises") if isinstance(block, dict) else []
                if not isinstance(exercises, list):
                    continue
                exercise_count += len(exercises)
                for exercise in exercises:
                    sets = exercise.get("sets") if isinstance(exercise, dict) else []
                    if isinstance(sets, list):
                        set_count += len(sets)

    name = data.get("name") if isinstance(data, dict) else ""
    return (
        f'plan "{name}" — {len(weeks)} week(s), {day_count} day(s), '
        f"{block_count} block(s), {exercise_count} exercise(s), {set_count} set(s)"
    )
