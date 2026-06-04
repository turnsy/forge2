"""Workout plan builder aligned to workout-plan.schema.json v2.0.0."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from forge_plan.builders import (
    build_set_entry,
    empty_plan_template,
    load_seed_from_file,
    next_set_id,
    validate_day_code,
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


class Plan:
    """Mutable workout plan builder."""

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
        index: int,
        label: str | None = None,
        name: str | None = None,
    ) -> WeekRef:
        """Add or update a week by index."""
        weeks = self._ensure_weeks()
        week = self._find_week(weeks, index)
        if week is None:
            week = {"index": index, "days": []}
            weeks.append(week)
            weeks.sort(key=lambda item: int(item["index"]))

        if label is not None:
            week["label"] = label
        if name is not None:
            week["name"] = name
        return WeekRef(self, week)

    def add_day(
        self,
        *,
        week_index: int,
        index: int,
        code: str,
        name: str | None = None,
    ) -> DayRef:
        """Add or update a day inside a week. ``code`` must match ``w{n}d{m}``."""
        validate_day_code(code)
        week = self._require_week(week_index)
        days = week.setdefault("days", [])
        day = self._find_day(days, index)
        if day is None:
            day = {"index": index, "code": code, "exercises": []}
            days.append(day)
            days.sort(key=lambda item: int(item["index"]))
        else:
            day["code"] = code

        if name is not None:
            day["name"] = name
        return DayRef(self, day)

    def add_exercise(
        self,
        *,
        week_index: int,
        day_index: int,
        name: str,
    ) -> ExerciseRef:
        """Append an exercise to a day."""
        day = self._require_day(week_index, day_index)
        exercises = day.setdefault("exercises", [])
        exercise = {"name": name, "sets": []}
        exercises.append(exercise)
        return ExerciseRef(self, exercise)

    def add_set(
        self,
        week_index: int,
        day_index: int,
        exercise_index: int,
        *,
        reps: int | str,
        load_type: str = "absolute",
        load_value: float,
        unit: str = "kg",
    ) -> None:
        """Append a planned set to an exercise (generates set id)."""
        exercise = self._require_exercise(week_index, day_index, exercise_index)
        sets = exercise.setdefault("sets", [])
        day = self._require_day(week_index, day_index)
        set_id = next_set_id(str(day["code"]), str(exercise["name"]), sets)
        sets.append(
            build_set_entry(
                set_id=set_id,
                reps=reps,
                load_type=load_type,
                load_value=load_value,
                unit=unit,
            )
        )

    def to_dict(self) -> dict[str, Any]:
        """Return JSON-serializable plan data (schema v2.0.0)."""
        return dict(self._data)

    def write_json(self, path: str) -> None:
        """Write plan JSON to ``output/plan.json`` (creates parent dirs)."""
        target = Path(path)
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

    def _find_week(self, weeks: list[dict[str, Any]], index: int) -> dict[str, Any] | None:
        for week in weeks:
            if int(week.get("index", -1)) == index:
                return week
        return None

    def _find_day(self, days: list[dict[str, Any]], index: int) -> dict[str, Any] | None:
        for day in days:
            if int(day.get("index", -1)) == index:
                return day
        return None

    def _require_week(self, week_index: int) -> dict[str, Any]:
        week = self._find_week(self._ensure_weeks(), week_index)
        if week is None:
            raise ValueError(f"week {week_index} does not exist; call add_week first")
        return week

    def _require_day(self, week_index: int, day_index: int) -> dict[str, Any]:
        week = self._require_week(week_index)
        days = week.get("days")
        if not isinstance(days, list):
            raise ValueError(f"week {week_index} has no days")
        day = self._find_day(days, day_index)
        if day is None:
            raise ValueError(
                f"day {day_index} in week {week_index} does not exist; call add_day first"
            )
        return day

    def _require_exercise(
        self, week_index: int, day_index: int, exercise_index: int
    ) -> dict[str, Any]:
        day = self._require_day(week_index, day_index)
        exercises = day.get("exercises")
        if not isinstance(exercises, list) or exercise_index < 0 or exercise_index >= len(
            exercises
        ):
            raise ValueError(
                f"exercise index {exercise_index} out of range for week {week_index} day {day_index}"
            )
        return exercises[exercise_index]


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
            exercises = day.get("exercises") if isinstance(day, dict) else []
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
        f"{exercise_count} exercise(s), {set_count} set(s)"
    )
