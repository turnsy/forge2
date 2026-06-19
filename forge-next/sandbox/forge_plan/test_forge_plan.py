"""Unit tests for forge_plan (stdlib unittest — no extra deps)."""

from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from forge_plan import Plan, summarize
from forge_plan.builders import (
    empty_plan_template,
    format_day_code,
    load_seed_from_file,
    validate_day_code,
)


class ForgePlanTests(unittest.TestCase):
    def test_empty_plan_is_empty(self) -> None:
        plan = Plan.empty("Test")
        self.assertTrue(plan.is_empty())

    def test_add_week_day_exercise_set(self) -> None:
        plan = Plan.empty("Strength")
        plan.add_week(label="Week 1")
        plan.add_day(week_index=1, name="Lower")
        plan.add_exercise(week_index=1, day_index=1, name="Back Squat")
        plan.add_set(week_index=1, day_index=1, reps=5, load_value=100, unit="kg")

        data = plan.to_dict()
        self.assertEqual(data["schemaVersion"], "2.0.0")
        self.assertEqual(data["name"], "Strength")
        self.assertEqual(len(data["weeks"]), 1)
        self.assertEqual(data["weeks"][0]["days"][0]["code"], "w1d1")
        set_entry = data["weeks"][0]["days"][0]["exercises"][0]["sets"][0]
        self.assertEqual(set_entry["id"], "w1d1-bs-1")
        self.assertEqual(set_entry["planned"]["reps"], 5)

    def test_add_set_notes(self) -> None:
        plan = Plan.empty("Notes")
        plan.add_week()
        plan.add_day(week_index=1)
        plan.add_exercise(week_index=1, day_index=1, name="Lunge")
        plan.add_set(
            week_index=1,
            day_index=1,
            reps=3,
            load_value=0,
            load_type="absolute",
            notes="per side",
        )
        planned = plan.to_dict()["weeks"][0]["days"][0]["exercises"][0]["sets"][0]["planned"]
        self.assertEqual(planned["reps"], 3)
        self.assertEqual(planned["notes"], "per side")

    def test_add_day_derives_code_from_position(self) -> None:
        plan = Plan.empty("Codes")
        plan.add_week()
        plan.add_day(week_index=1, name="Mon")
        plan.add_day(week_index=1, name="Wed")
        days = plan.to_dict()["weeks"][0]["days"]
        self.assertEqual(days[0]["code"], "w1d1")
        self.assertEqual(days[1]["code"], "w1d2")

    def test_add_week_appends_when_index_omitted(self) -> None:
        plan = Plan.empty("Weeks")
        plan.add_week(label="A")
        plan.add_week(label="B")
        labels = [w["label"] for w in plan.to_dict()["weeks"]]
        self.assertEqual(labels, ["A", "B"])
        self.assertEqual(plan.to_dict()["weeks"][1]["index"], 2)

    def test_add_set_by_exercise_name(self) -> None:
        plan = Plan.empty("Named ex")
        plan.add_week()
        plan.add_day(week_index=1)
        plan.add_exercise(week_index=1, day_index=1, name="Bench")
        plan.add_exercise(week_index=1, day_index=1, name="Row")
        plan.add_set(
            week_index=1,
            day_index=1,
            exercise_name="Bench",
            reps=8,
            load_value=60,
            unit="kg",
        )
        sets = plan.to_dict()["weeks"][0]["days"][0]["exercises"][0]["sets"]
        self.assertEqual(len(sets), 1)
        self.assertEqual(sets[0]["planned"]["reps"], 8)

    def test_percentage_set_without_basis(self) -> None:
        plan = Plan.empty("Pct")
        plan.add_week()
        plan.add_day(week_index=1)
        plan.add_exercise(week_index=1, day_index=1, name="Bench")
        plan.add_set(
            week_index=1,
            day_index=1,
            reps=5,
            load_type="percentage",
            load_value=85,
            unit="kg",
        )

        load = plan.to_dict()["weeks"][0]["days"][0]["exercises"][0]["sets"][0]["planned"]["load"]
        self.assertEqual(load["type"], "percentage")
        self.assertEqual(load["value"], 85)
        self.assertEqual(load["absoluteUnit"], "kg")
        self.assertNotIn("basis", load)

    def test_move_week_renumbers_indices(self) -> None:
        plan = Plan.empty("Reorder")
        plan.add_week(index=1, label="A")
        plan.add_week(index=2, label="B")
        plan.move_week(0, 1)

        weeks = plan.to_dict()["weeks"]
        self.assertEqual(weeks[0]["label"], "B")
        self.assertEqual(weeks[0]["index"], 1)
        self.assertEqual(weeks[1]["label"], "A")
        self.assertEqual(weeks[1]["index"], 2)

    def test_move_day_renumbers_codes(self) -> None:
        plan = Plan.empty("Days")
        plan.add_week()
        plan.add_day(week_index=1, name="Mon")
        plan.add_day(week_index=1, name="Wed")
        plan.move_day(1, 0, 1)

        days = plan.to_dict()["weeks"][0]["days"]
        self.assertEqual(days[0]["name"], "Wed")
        self.assertEqual(days[0]["code"], "w1d1")
        self.assertEqual(days[1]["name"], "Mon")
        self.assertEqual(days[1]["code"], "w1d2")

    def test_move_exercise(self) -> None:
        plan = Plan.empty("Ex")
        plan.add_week()
        plan.add_day(week_index=1)
        plan.add_exercise(week_index=1, day_index=1, name="Squat")
        plan.add_exercise(week_index=1, day_index=1, name="Bench")
        plan.move_exercise(1, 1, 0, 1)

        names = [
            ex["name"]
            for ex in plan.to_dict()["weeks"][0]["days"][0]["exercises"]
        ]
        self.assertEqual(names, ["Bench", "Squat"])

    def test_move_set(self) -> None:
        plan = Plan.empty("Sets")
        plan.add_week()
        plan.add_day(week_index=1)
        plan.add_exercise(week_index=1, day_index=1, name="Curl")
        plan.add_set(week_index=1, day_index=1, reps=8, load_value=20, unit="kg")
        plan.add_set(week_index=1, day_index=1, reps=12, load_value=15, unit="kg")
        plan.move_set(1, 1, 0, 0, 1)

        reps = [
            s["planned"]["reps"]
            for s in plan.to_dict()["weeks"][0]["days"][0]["exercises"][0]["sets"]
        ]
        self.assertEqual(reps, [12, 8])

    def test_remove_week(self) -> None:
        plan = Plan.empty("Rm")
        plan.add_week()
        plan.add_week()
        plan.remove_week(0)
        self.assertEqual(len(plan.to_dict()["weeks"]), 1)
        self.assertEqual(plan.to_dict()["weeks"][0]["index"], 1)

    def test_remove_day_exercise_set(self) -> None:
        plan = Plan.empty("Rm nested")
        plan.add_week()
        plan.add_day(week_index=1)
        plan.add_day(week_index=1)
        plan.add_exercise(week_index=1, day_index=1, name="A")
        plan.add_exercise(week_index=1, day_index=1, name="B")
        plan.add_set(
            week_index=1,
            day_index=1,
            exercise_name="A",
            reps=5,
            load_value=50,
            unit="kg",
        )
        plan.remove_set(1, 1, 0, 0)
        plan.remove_exercise(1, 1, 0)
        plan.remove_day(1, 1)

        data = plan.to_dict()
        self.assertEqual(len(data["weeks"][0]["days"]), 1)
        self.assertEqual(data["weeks"][0]["days"][0]["code"], "w1d1")
        self.assertEqual(len(data["weeks"][0]["days"][0]["exercises"]), 1)
        self.assertEqual(data["weeks"][0]["days"][0]["exercises"][0]["name"], "B")

    def test_from_json_file_missing_uses_empty_template(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            path = str(Path(tmp) / "missing.json")
            plan = Plan.from_json_file(path)
            self.assertTrue(plan.is_empty())

    def test_write_json_round_trip(self) -> None:
        plan = Plan.empty("Out")
        plan.add_week()
        plan.add_day(week_index=1)
        plan.add_exercise(week_index=1, day_index=1, name="Bench")
        plan.add_set(week_index=1, day_index=1, reps=3, load_value=60, unit="kg")

        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp) / "output" / "plan.json"
            plan.write_json(str(out))
            loaded = json.loads(out.read_text(encoding="utf-8"))
            self.assertEqual(loaded["name"], "Out")
            self.assertEqual(len(loaded["weeks"][0]["days"][0]["exercises"]), 1)

    def test_summarize_nonempty(self) -> None:
        plan = Plan.empty("Named")
        plan.add_week()
        plan.add_day(week_index=1)
        text = summarize(plan)
        self.assertIn("1 week", text)

    def test_validate_day_code_rejects_uppercase(self) -> None:
        validate_day_code("w1d1")
        with self.assertRaises(ValueError) as ctx:
            validate_day_code("W1D1")
        self.assertIn("lowercase", str(ctx.exception).lower())

    def test_format_day_code(self) -> None:
        self.assertEqual(format_day_code(2, 3), "w2d3")

    def test_load_seed_from_file_invalid_json(self) -> None:
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as handle:
            handle.write("{not json")
            handle.flush()
            data = load_seed_from_file(handle.name)
        self.assertEqual(data, empty_plan_template())


if __name__ == "__main__":
    unittest.main()
