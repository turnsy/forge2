"""ID helpers for workout plan JSON."""

from __future__ import annotations

import re
import uuid
from typing import Any


DAY_CODE_PATTERN = re.compile(r"^w[0-9]+d[0-9]+$")


def new_id() -> str:
    return str(uuid.uuid4())


def format_day_code(week_number: int, day_number: int) -> str:
    return f"w{week_number}d{day_number}"


def exercise_slug(name: str) -> str:
    parts = re.findall(r"[A-Za-z0-9]+", name)
    if not parts:
        return "ex"
    if len(parts) == 1:
        token = parts[0]
        return token[:2].lower() if len(token) >= 2 else token.lower()
    return "".join(word[0].lower() for word in parts[:4])


def next_set_id(day_code: str, exercise_name: str, existing_sets: list[dict[str, Any]]) -> str:
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
