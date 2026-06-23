"""Tests for schema_rules cheat sheet content."""

from __future__ import annotations

import unittest

from forge_plan.schema_rules import validation_rules_cheat_sheet


class SchemaRulesTests(unittest.TestCase):
    def test_cheat_sheet_mentions_day_code_rules(self) -> None:
        text = validation_rules_cheat_sheet()
        self.assertIn("w1d1", text)
        self.assertIn("W1D1", text)
        self.assertIn("^w[0-9]+d[0-9]+$", text)

    def test_cheat_sheet_reps_integer_and_notes(self) -> None:
        text = validation_rules_cheat_sheet()
        self.assertIn("plain integer", text)
        self.assertIn('notes="per side"', text)
        self.assertIn("3/side", text)

    def test_cheat_sheet_mentions_superset_api(self) -> None:
        text = validation_rules_cheat_sheet()
        self.assertIn("add_superset", text)
        self.assertIn("SupersetRef.add_exercise", text)
        self.assertIn("2.1.0", text)


if __name__ == "__main__":
    unittest.main()
