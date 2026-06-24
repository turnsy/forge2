"""Parse planned set target values for workout-plan schema v3."""

from __future__ import annotations

from typing import Any


def parse_target(value: int | float | str, unit: str) -> dict[str, Any]:
    """Return a schema ``target`` object (absolute or percentage).

    - ``int`` / ``float`` → absolute load
    - ``str`` ending with ``%`` → percentage load (e.g. ``\"75%\"``)
    """
    normalized_unit = unit.strip()
    if not normalized_unit:
        raise ValueError("unit must be a non-empty string")

    if isinstance(value, (int, float)):
        if value < 0:
            raise ValueError("absolute target value must be >= 0")
        return {
            "type": "absolute",
            "value": float(value),
            "unit": normalized_unit,
        }

    if isinstance(value, str):
        trimmed = value.strip()
        if trimmed.endswith("%"):
            numeric_part = trimmed[:-1].strip()
            try:
                numeric = float(numeric_part)
            except ValueError as exc:
                raise ValueError(
                    f"invalid percentage target {value!r}; expected a number followed by %"
                ) from exc
            if numeric < 0:
                raise ValueError("percentage target value must be >= 0")
            return {
                "type": "percentage",
                "value": numeric,
                "unit": normalized_unit,
            }

    raise ValueError(
        "target must be a number (absolute) or a string like '75%' (percentage)"
    )
