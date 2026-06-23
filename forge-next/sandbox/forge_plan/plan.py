"""Workout plan builder aligned to workout-plan.schema.json v2.1.0."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from forge_plan.builders import (
    SCHEMA_VERSION,
    build_set_entry,
    empty_plan_template,
    format_day_code,
    load_seed_from_file,
    move_list_item,
    next_set_id,
)


class WeekRef:
    """Handle to a week inside a plan."""

    def __init__(self, plan: "Plan", week: dict[str, Any]) -> None:
        self._plan = plan
        self._week = week

    @property
    def index(self) -> int:
        return int(self._week["index"])


class DayRef:
    """Handle to a day inside a plan."""

    def __init__(self, plan: "Plan", day: dict[str, Any]) -> None:
        self._plan = plan
        self._day = day

    @property
    def index(self) -> int:
        return int(self._day["index"])

    @property
    def code(self) -> str:
        return str(self._day["code"])


class ExerciseRef:
    """Handle to an exercise inside a plan."""

    def __init__(self, plan: "Plan", exercise: dict[str, Any]) -> None:
        self._plan = plan
        self._exercise = exercise

    @property
    def name(self) -> str:
        return str(self._exercise["name"])


class SupersetRef:
    """Handle to a superset block inside a plan."""

    def __init__(self, plan: "Plan", superset: dict[str, Any]) -> None:
        self._plan = plan
        self._superset = superset

    def add_exercise(self, name: str) -> ExerciseRef:
        """Append an exercise to this superset with the same round count."""
        exercises = self._superset.setdefault("exercises", [])
        round_count = len(exercises[0]["sets"]) if exercises else 3
        exercise = {"name": name, "sets": []}
        exercises.append(exercise)
        for _ in range(round_count):
            set_id = next_set_id("w0d0", name, exercise["sets"])
            exercise["sets"].append(
                build_set_entry(
                    set_id=set_id,
                    reps=10,
                    load_type="absolute",
                    load_value=0,
                    unit="lb",
                )
            )
        self._plan._sync_structure()
        return ExerciseRef(self._plan, exercise)


class Plan:
    """Mutable workout plan builder for workout-plan.schema.json v2.1.0.

    See ``forge_plan.schema_rules.validation_rules_cheat_sheet()`` for field-level
    constraints (day codes, reps, loads, min array lengths).
    """

    def __init__(self, data: dict[str, Any] | None = None) -> None:
        self._data = data if data is not None else empty_plan_template()

    @classmethod
    def from_json_file(cls, path: str) -> "Plan":
        """Load seed from ``current_plan.json`` (empty template when missing)."""
        return cls(load_seed_from_file(path))

    @classmethod
    def empty(cls, name: str) -> "Plan":
        """Create a new named plan with no weeks."""
        data = empty_plan_template()
        data["name"] = name
        return cls(data)

    @classmethod
    def from_dict(cls, value: dict[str, Any]) -> "Plan":
        """Wrap an existing plan dict."""
        return cls(dict(value))

    def is_empty(self) -> bool:
        """True when the plan has no weeks (seed not yet built)."""
        weeks = self._data.get("weeks")
        return not isinstance(weeks, list) or len(weeks) == 0

    def add_week(
        self,
        *,
        label: str | None = None,
        name: str | None = None,
        index: int | None = None,
    ) -> WeekRef:
        """Append a week, or upsert by schema ``index`` when provided."""
        weeks = self._ensure_weeks()
        if index is None:
            week: dict[str, Any] = {"index": 0, "days": []}
            weeks.append(week)
        else:
            week = self._find_week_by_schema_index(weeks, index)
            if week is None:
                week = {"index": index, "days": []}
                weeks.append(week)

        if label is not None:
            week["label"] = label
        if name is not None:
            week["name"] = name

        self._sync_structure()
        return WeekRef(self, week)

    def add_day(
        self,
        *,
        week_index: int,
        name: str | None = None,
        index: int | None = None,
    ) -> DayRef:
        """Append a day to a week, or upsert by schema ``day_index`` when provided."""
        week = self._require_week_by_schema_index(week_index)
        days = week.setdefault("days", [])
        if index is None:
            day: dict[str, Any] = {"index": 0, "code": "w0d0", "blocks": []}
            days.append(day)
        else:
            day = self._find_day_by_schema_index(days, index)
            if day is None:
                day = {"index": index, "code": "w0d0", "blocks": []}
                days.append(day)

        if name is not None:
            day["name"] = name

        self._sync_structure()
        return DayRef(self, day)

    def add_exercise(
        self,
        *,
        week_index: int,
        day_index: int,
        name: str,
    ) -> ExerciseRef:
        """Append a standalone exercise block to a day."""
        day = self._require_day_by_schema_index(week_index, day_index)
        blocks = day.setdefault("blocks", [])
        exercise = {"name": name, "sets": []}
        blocks.append({"type": "exercise", "exercise": exercise})
        self._sync_structure()
        return ExerciseRef(self, exercise)

    def add_superset(
        self,
        week_index: int,
        day_index: int,
        *,
        rounds: int = 3,
        notes: str | None = None,
    ) -> SupersetRef:
        """Append a superset block with two default exercises."""
        day = self._require_day_by_schema_index(week_index, day_index)
        blocks = day.setdefault("blocks", [])
        exercises = []
        for label in ("Exercise A", "Exercise B"):
            exercise = {"name": label, "sets": []}
            for _ in range(rounds):
                set_id = next_set_id("w0d0", label, exercise["sets"])
                exercise["sets"].append(
                    build_set_entry(
                        set_id=set_id,
                        reps=10,
                        load_type="absolute",
                        load_value=0,
                        unit="lb",
                    )
                )
            exercises.append(exercise)

        superset: dict[str, Any] = {"type": "superset", "exercises": exercises}
        if notes is not None:
            superset["notes"] = notes
        blocks.append(superset)
        self._sync_structure()
        return SupersetRef(self, superset)

    def add_set(
        self,
        week_index: int,
        day_index: int,
        *,
        reps: int | str,
        load_value: float,
        load_type: str = "absolute",
        unit: str = "kg",
        notes: str | None = None,
        exercise_name: str | None = None,
        exercise_index: int | None = None,
    ) -> None:
        """Append a planned exact set to a day."""
        week_pos, day_pos = self._schema_week_day_positions(week_index, day_index)
        day = self._require_day_at(week_pos, day_pos)
        exercise = self._resolve_exercise(
            day,
            week_index=week_index,
            day_index=day_index,
            exercise_name=exercise_name,
            exercise_index=exercise_index,
        )
        sets = exercise.setdefault("sets", [])
        set_id = next_set_id(str(day["code"]), str(exercise["name"]), sets)
        sets.append(
            build_set_entry(
                set_id=set_id,
                reps=reps,
                load_type=load_type,
                load_value=load_value,
                unit=unit,
                notes=notes,
            )
        )
        self._sync_structure()

    def move_week(self, from_index: int, to_index: int) -> None:
        """Reorder weeks by 0-based array position."""
        weeks = self._ensure_weeks()
        move_list_item(weeks, from_index, to_index)
        self._sync_structure()

    def remove_week(self, index: int) -> None:
        """Remove a week by 0-based array position."""
        weeks = self._ensure_weeks()
        if index < 0 or index >= len(weeks):
            raise ValueError(f"week array index {index} out of range")
        weeks.pop(index)
        self._sync_structure()

    def move_day(self, week_index: int, from_index: int, to_index: int) -> None:
        """Reorder days within a week."""
        week_pos = self._schema_week_position(week_index)
        week = self._require_week_at(week_pos)
        days = week.setdefault("days", [])
        move_list_item(days, from_index, to_index)
        self._sync_structure()

    def remove_day(self, week_index: int, index: int) -> None:
        """Remove a day by 0-based array position within a week."""
        week_pos = self._schema_week_position(week_index)
        week = self._require_week_at(week_pos)
        days = week.setdefault("days", [])
        if index < 0 or index >= len(days):
            raise ValueError(f"day array index {index} out of range")
        days.pop(index)
        self._sync_structure()

    def move_exercise(
        self, week_index: int, day_index: int, from_index: int, to_index: int
    ) -> None:
        """Reorder standalone exercise blocks (0-based block positions)."""
        week_pos, day_pos = self._schema_week_day_positions(week_index, day_index)
        day = self._require_day_at(week_pos, day_pos)
        blocks = day.setdefault("blocks", [])
        exercise_positions = [
            index
            for index, block in enumerate(blocks)
            if isinstance(block, dict) and block.get("type") == "exercise"
        ]
        if from_index < 0 or from_index >= len(exercise_positions):
            raise ValueError(f"exercise block index {from_index} out of range")
        if to_index < 0 or to_index >= len(exercise_positions):
            raise ValueError(f"exercise block index {to_index} out of range")
        move_list_item(blocks, exercise_positions[from_index], exercise_positions[to_index])
        self._sync_structure()

    def remove_exercise(self, week_index: int, day_index: int, index: int) -> None:
        """Remove a standalone exercise block by 0-based exercise block index."""
        week_pos, day_pos = self._schema_week_day_positions(week_index, day_index)
        day = self._require_day_at(week_pos, day_pos)
        blocks = day.setdefault("blocks", [])
        exercise_positions = [
            pos
            for pos, block in enumerate(blocks)
            if isinstance(block, dict) and block.get("type") == "exercise"
        ]
        if index < 0 or index >= len(exercise_positions):
            raise ValueError(f"exercise block index {index} out of range")
        blocks.pop(exercise_positions[index])
        self._sync_structure()

    def move_set(
        self,
        week_index: int,
        day_index: int,
        exercise_index: int,
        from_index: int,
        to_index: int,
    ) -> None:
        """Reorder sets within an exercise (0-based flat exercise index)."""
        week_pos, day_pos = self._schema_week_day_positions(week_index, day_index)
        day = self._require_day_at(week_pos, day_pos)
        exercise = self._resolve_exercise(
            day,
            week_index=week_index,
            day_index=day_index,
            exercise_index=exercise_index,
        )
        sets = exercise.setdefault("sets", [])
        move_list_item(sets, from_index, to_index)
        self._sync_structure()

    def remove_set(
        self,
        week_index: int,
        day_index: int,
        exercise_index: int,
        index: int,
    ) -> None:
        """Remove a set by 0-based array position."""
        week_pos, day_pos = self._schema_week_day_positions(week_index, day_index)
        day = self._require_day_at(week_pos, day_pos)
        exercise = self._resolve_exercise(
            day,
            week_index=week_index,
            day_index=day_index,
            exercise_index=exercise_index,
        )
        sets = exercise.setdefault("sets", [])
        if index < 0 or index >= len(sets):
            raise ValueError(f"set array index {index} out of range")
        sets.pop(index)
        self._sync_structure()

    def to_dict(self) -> dict[str, Any]:
        """Return JSON-serializable plan data (schema v2.1.0)."""
        return dict(self._data)

    def write_json(self, path: str) -> None:
        """Write plan JSON to ``output/plan.json`` (creates parent dirs)."""
        target = Path(path)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(
            json.dumps(self.to_dict(), indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )

    def _sync_structure(self) -> None:
        """Renumber week/day schema indices and day codes to match array order."""
        weeks = self._ensure_weeks()
        for week_pos, week in enumerate(weeks):
            week_number = week_pos + 1
            week["index"] = week_number
            days = week.get("days")
            if not isinstance(days, list):
                week["days"] = []
                continue
            for day_pos, day in enumerate(days):
                day_number = day_pos + 1
                day["index"] = day_number
                day["code"] = format_day_code(week_number, day_number)

    def _iter_exercises(self, day: dict[str, Any]) -> list[dict[str, Any]]:
        exercises: list[dict[str, Any]] = []
        blocks = day.get("blocks")
        if not isinstance(blocks, list):
            legacy = day.get("exercises")
            if isinstance(legacy, list):
                return legacy
            return exercises

        for block in blocks:
            if not isinstance(block, dict):
                continue
            if block.get("type") == "exercise":
                exercise = block.get("exercise")
                if isinstance(exercise, dict):
                    exercises.append(exercise)
            elif block.get("type") == "superset":
                superset_exercises = block.get("exercises")
                if isinstance(superset_exercises, list):
                    exercises.extend(item for item in superset_exercises if isinstance(item, dict))
        return exercises

    def _resolve_exercise(
        self,
        day: dict[str, Any],
        *,
        week_index: int,
        day_index: int,
        exercise_name: str | None = None,
        exercise_index: int | None = None,
    ) -> dict[str, Any]:
        exercises = self._iter_exercises(day)
        if len(exercises) == 0:
            raise ValueError(
                f"week {week_index} day {day_index} has no exercises; call add_exercise first"
            )

        if exercise_name is not None:
            for exercise in exercises:
                if str(exercise.get("name")) == exercise_name:
                    return exercise
            raise ValueError(
                f'exercise {exercise_name!r} not found on week {week_index} day {day_index}'
            )

        if exercise_index is not None:
            if exercise_index < 0 or exercise_index >= len(exercises):
                raise ValueError(
                    f"exercise_index {exercise_index} out of range for week {week_index} day {day_index}"
                )
            return exercises[exercise_index]

        return exercises[-1]

    def _ensure_weeks(self) -> list[dict[str, Any]]:
        weeks = self._data.get("weeks")
        if not isinstance(weeks, list):
            weeks = []
            self._data["weeks"] = weeks
        return weeks

    def _find_week_by_schema_index(
        self, weeks: list[dict[str, Any]], index: int
    ) -> dict[str, Any] | None:
        for week in weeks:
            if int(week.get("index", -1)) == index:
                return week
        return None

    def _find_day_by_schema_index(
        self, days: list[dict[str, Any]], index: int
    ) -> dict[str, Any] | None:
        for day in days:
            if int(day.get("index", -1)) == index:
                return day
        return None

    def _schema_week_position(self, week_index: int) -> int:
        weeks = self._ensure_weeks()
        for pos, week in enumerate(weeks):
            if int(week.get("index", -1)) == week_index:
                return pos
        raise ValueError(f"week {week_index} does not exist; call add_week first")

    def _schema_week_day_positions(self, week_index: int, day_index: int) -> tuple[int, int]:
        week_pos = self._schema_week_position(week_index)
        week = weeks[week_pos] if (weeks := self._ensure_weeks()) else None
        if week is None:
            raise ValueError(f"week {week_index} does not exist")
        days = week.get("days")
        if not isinstance(days, list):
            raise ValueError(f"week {week_index} has no days")
        for pos, day in enumerate(days):
            if int(day.get("index", -1)) == day_index:
                return week_pos, pos
        raise ValueError(
            f"day {day_index} in week {week_index} does not exist; call add_day first"
        )

    def _require_week_by_schema_index(self, week_index: int) -> dict[str, Any]:
        week = self._find_week_by_schema_index(self._ensure_weeks(), week_index)
        if week is None:
            raise ValueError(f"week {week_index} does not exist; call add_week first")
        return week

    def _require_week_at(self, week_pos: int) -> dict[str, Any]:
        weeks = self._ensure_weeks()
        if week_pos < 0 or week_pos >= len(weeks):
            raise ValueError(f"week array index {week_pos} out of range")
        return weeks[week_pos]

    def _require_day_by_schema_index(self, week_index: int, day_index: int) -> dict[str, Any]:
        week_pos, day_pos = self._schema_week_day_positions(week_index, day_index)
        return self._require_day_at(week_pos, day_pos)

    def _require_day_at(self, week_pos: int, day_pos: int) -> dict[str, Any]:
        week = self._require_week_at(week_pos)
        days = week.get("days")
        if not isinstance(days, list):
            raise ValueError(f"week at position {week_pos} has no days")
        if day_pos < 0 or day_pos >= len(days):
            raise ValueError(f"day array index {day_pos} out of range")
        return days[day_pos]


def summarize(plan: Plan | dict[str, Any]) -> str:
    """Return a short human-readable summary for sandbox debug prints."""
    data = plan.to_dict() if isinstance(plan, Plan) else plan
    weeks = data.get("weeks") if isinstance(data, dict) else []
    if not isinstance(weeks, list) or len(weeks) == 0:
        return "empty plan"

    day_count = 0
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
            for block in blocks:
                if not isinstance(block, dict):
                    continue
                if block.get("type") == "exercise":
                    exercise = block.get("exercise")
                    if isinstance(exercise, dict):
                        exercise_count += 1
                        sets = exercise.get("sets")
                        if isinstance(sets, list):
                            set_count += len(sets)
                elif block.get("type") == "superset":
                    superset_exercises = block.get("exercises")
                    if isinstance(superset_exercises, list):
                        exercise_count += len(superset_exercises)
                        for exercise in superset_exercises:
                            sets = exercise.get("sets") if isinstance(exercise, dict) else []
                            if isinstance(sets, list):
                                set_count += len(sets)

    name = data.get("name") if isinstance(data, dict) else ""
    return (
        f'plan "{name}" — {len(weeks)} week(s), {day_count} day(s), '
        f"{exercise_count} exercise(s), {set_count} set(s)"
    )
