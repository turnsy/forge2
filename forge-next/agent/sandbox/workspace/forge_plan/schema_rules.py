"""Read cheat-sheet rules from the single markdown source file."""

from __future__ import annotations

from pathlib import Path


def validation_rules_cheat_sheet() -> str:
    return Path(__file__).with_name("cheat-sheet.md").read_text(encoding="utf-8").strip()
