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


if __name__ == "__main__":
    unittest.main()
