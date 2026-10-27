"""Tests for schema_rules cheat sheet content."""

from __future__ import annotations

import unittest

from forge_plan.schema_rules import validation_rules_cheat_sheet


class SchemaRulesTests(unittest.TestCase):
    def test_cheat_sheet_mentions_plan_io(self) -> None:
        text = validation_rules_cheat_sheet()
        self.assertIn("Plan.load()", text)
        self.assertIn("plan.save()", text)
        self.assertIn("current_plan.json", text)

    def test_cheat_sheet_mentions_schema_version(self) -> None:
        text = validation_rules_cheat_sheet()
        self.assertIn("3.1.0", text)
        self.assertIn("w1d1", text)


if __name__ == "__main__":
    unittest.main()
