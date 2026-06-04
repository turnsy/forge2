"""Unit tests for forge_plan (stdlib unittest — no extra deps)."""

from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from forge_plan import Plan, summarize
from forge_plan.builders import empty_plan_template, load_seed_from_file


class ForgePlanTests(unittest.TestCase):
    def test_empty_plan_is_empty(self) -> None:
        plan = Plan.empty("Test")
        self.assertTrue(plan.is_empty())

    def test_add_week_day_exercise_set(self) -> None:
        plan = Plan.empty("Strength")
        plan.add_week(index=1, label="Week 1")
        plan.add_day(week_index=1, index=1, code="w1d1", name="Lower")
        plan.add_exercise(week_index=1, day_index=1, name="Back Squat")
        plan.add_set(1, 1, 0, reps=5, load_value=100, unit="kg")

        data = plan.to_dict()
        self.assertEqual(data["schemaVersion"], "2.0.0")
        self.assertEqual(data["name"], "Strength")
        self.assertEqual(len(data["weeks"]), 1)
        self.assertEqual(data["weeks"][0]["days"][0]["code"], "w1d1")
        set_entry = data["weeks"][0]["days"][0]["exercises"][0]["sets"][0]
        self.assertEqual(set_entry["id"], "w1d1-bs-1")
        self.assertEqual(set_entry["planned"]["reps"], 5)

    def test_from_json_file_missing_uses_empty_template(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = str(Path(tmp) / "missing.json")
            plan = Plan.from_json_file(path)
            self.assertTrue(plan.is_empty())

    def test_write_json_round_trip(self) -> None:
        plan = Plan.empty("Out")
        plan.add_week(index=1)
        plan.add_day(week_index=1, index=1, code="w1d1")
        plan.add_exercise(week_index=1, day_index=1, name="Bench")
        plan.add_set(1, 1, 0, reps=3, load_value=60, unit="kg")

        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp) / "output" / "plan.json"
            plan.write_json(str(out))
            loaded = json.loads(out.read_text(encoding="utf-8"))
            self.assertEqual(loaded["name"], "Out")
            self.assertEqual(len(loaded["weeks"][0]["days"][0]["exercises"]), 1)

    def test_summarize_nonempty(self) -> None:
        plan = Plan.empty("Named")
        plan.add_week(index=1)
        plan.add_day(week_index=1, index=1, code="w1d1")
        text = summarize(plan)
        self.assertIn("1 week", text)

    def test_load_seed_from_file_invalid_json(self) -> None:
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as handle:
            handle.write("{not json")
            handle.flush()
            data = load_seed_from_file(handle.name)
        self.assertEqual(data, empty_plan_template())


if __name__ == "__main__":
    unittest.main()
