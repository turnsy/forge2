"""Unit tests for forge_plan v3 (stdlib unittest)."""

from __future__ import annotations

import json
import os
import subprocess
import tempfile
import unittest
from pathlib import Path

from forge_plan import Day, Exercise, Plan, Week, summarize
from forge_plan.builders import SCHEMA_VERSION
from forge_plan.target import parse_target

ROOT = Path(__file__).resolve().parents[2]
VALIDATE_SCRIPT = ROOT / "scripts" / "validate-plan-json.mjs"


def assert_valid_schema(test: unittest.TestCase, plan_dict: dict) -> None:
    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as handle:
        json.dump(plan_dict, handle)
        handle.flush()
        path = handle.name

    result = subprocess.run(
        ["node", str(VALIDATE_SCRIPT), path],
        cwd=ROOT,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        test.fail(
            "plan JSON failed schema validation:\n"
            f"{result.stdout}\n{result.stderr}"
        )


def build_sample_plan() -> Plan:
    return (
        Plan("1 week bench")
        .add_week(
            Week(label="Week 1")
            .add_day(
                Day(name="Upper")
                .add_exercise(
                    Exercise("Bench press").add_sets(reps=5, target=50, unit="kg", count=3)
                )
                .add_superset(
                    Exercise("Bench press")
                    .add_set(reps=10, target=30, unit="kg")
                    .add_set(reps=10, target=32, unit="kg")
                    .add_set(reps=10, target=35, unit="kg"),
                    Exercise("Incline bench").add_sets(
                        reps=10,
                        target=20,
                        unit="kg",
                        count=3,
                    ),
                )
            )
        )
    )


class ParseTargetTests(unittest.TestCase):
    def test_absolute_from_number(self) -> None:
        self.assertEqual(
            parse_target(50, "kg"),
            {"type": "absolute", "value": 50.0, "unit": "kg"},
        )

    def test_percentage_from_string(self) -> None:
        self.assertEqual(
            parse_target("75%", "kg"),
            {"type": "percentage", "value": 75.0, "unit": "kg"},
        )

    def test_rejects_ambiguous_string(self) -> None:
        with self.assertRaises(ValueError):
            parse_target("50", "kg")


class ForgePlanBuildTests(unittest.TestCase):
    def test_fluent_build_matches_v3_shape(self) -> None:
        plan = build_sample_plan()
        data = plan.to_dict()

        self.assertEqual(data["schemaVersion"], SCHEMA_VERSION)
        self.assertEqual(data["name"], "1 week bench")
        self.assertEqual(len(data["weeks"]), 1)
        day = data["weeks"][0]["days"][0]
        self.assertEqual(day["code"], "w1d1")
        self.assertEqual(len(day["blocks"]), 2)
        self.assertEqual(len(day["blocks"][0]["exercises"]), 1)
        self.assertEqual(len(day["blocks"][1]["exercises"]), 2)
        self.assertEqual(len(day["blocks"][0]["exercises"][0]["sets"]), 3)

    def test_output_passes_json_schema(self) -> None:
        assert_valid_schema(self, build_sample_plan().to_dict())

    def test_percentage_target_in_output(self) -> None:
        plan = (
            Plan("Pct")
            .add_week(
                Week()
                .add_day(
                    Day()
                    .add_exercise(
                        Exercise("Squat").add_set(reps=5, target="85%", unit="kg")
                    )
                )
            )
        )
        target = (
            plan.to_dict()["weeks"][0]["days"][0]["blocks"][0]["exercises"][0]["sets"][0][
                "planned"
            ]["target"]
        )
        self.assertEqual(target["type"], "percentage")
        self.assertEqual(target["value"], 85.0)
        assert_valid_schema(self, plan.to_dict())


class ForgePlanEditTests(unittest.TestCase):
    def test_positional_update(self) -> None:
        plan = build_sample_plan()
        plan.week(0).day(0).block(0).exercise(0).set(0).update(reps=6, target=55, unit="kg")

        first_set = (
            plan.to_dict()["weeks"][0]["days"][0]["blocks"][0]["exercises"][0]["sets"][0]
        )
        self.assertEqual(first_set["planned"]["reps"], 6)
        self.assertEqual(first_set["planned"]["target"]["value"], 55.0)
        assert_valid_schema(self, plan.to_dict())

    def test_flat_exercise_navigation(self) -> None:
        plan = build_sample_plan()
        plan.week(0).day(0).exercise(1).set(0).update(target="70%", unit="kg")

        superset_first = (
            plan.to_dict()["weeks"][0]["days"][0]["blocks"][1]["exercises"][0]["sets"][0]
        )
        self.assertEqual(superset_first["planned"]["target"]["type"], "percentage")
        assert_valid_schema(self, plan.to_dict())

    def test_ref_add_set_on_existing_exercise(self) -> None:
        plan = build_sample_plan()
        plan.week(0).day(0).block(0).exercise(0).add_set(reps=3, target=60, unit="kg")

        sets = plan.to_dict()["weeks"][0]["days"][0]["blocks"][0]["exercises"][0]["sets"]
        self.assertEqual(len(sets), 4)
        assert_valid_schema(self, plan.to_dict())

    def test_move_and_remove_day(self) -> None:
        plan = (
            Plan("Two days")
            .add_week(
                Week()
                .add_day(Day(name="Mon").add_exercise(Exercise("A").add_set(reps=5, target=10, unit="kg")))
                .add_day(Day(name="Wed").add_exercise(Exercise("B").add_set(reps=5, target=10, unit="kg")))
            )
        )
        plan.week(0).day(0).move(1)
        names = [day["name"] for day in plan.to_dict()["weeks"][0]["days"]]
        self.assertEqual(names, ["Wed", "Mon"])
        plan.week(0).day(1).remove()
        assert_valid_schema(self, plan.to_dict())


class ForgePlanSeedTests(unittest.TestCase):
    def test_plan_load_empty_when_missing(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            previous = Path.cwd()
            try:
                os.chdir(tmp)
                self.assertTrue(Plan.load().is_empty())
            finally:
                os.chdir(previous)

    def test_plan_save_writes_output(self) -> None:
        plan = build_sample_plan()
        with tempfile.TemporaryDirectory() as tmp:
            previous = Path.cwd()
            try:
                os.chdir(tmp)
                plan.save()
                output = Path("output/plan.json")
                self.assertTrue(output.is_file())
                loaded = json.loads(output.read_text(encoding="utf-8"))
                self.assertEqual(loaded, plan.to_dict())
            finally:
                os.chdir(previous)


class SummarizeTests(unittest.TestCase):
    def test_summarize_counts_blocks(self) -> None:
        text = summarize(build_sample_plan())
        self.assertIn('plan "1 week bench"', text)
        self.assertIn("2 block(s)", text)


if __name__ == "__main__":
    unittest.main()
