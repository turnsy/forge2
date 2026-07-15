Schema validation (workout-plan.schema.json v3.1.0 — output must pass):

- Plan: schemaVersion "3.1.0", non-empty name, at least 1 week
- Week: at least 1 day
- Day: code is auto w{N}d{M} (lowercase, e.g. w1d1); at least 1 block; do not hand-set codes unless editing
- Block: at least 1 exercise; 1 exercise = standalone, 2+ = superset
- Exercise: non-empty id and name; at least 1 set
- Set: id auto (e.g. w1d1-bs-1); planned.type "exact" from builders
- Reps: integer preferred; "5+5" only for rep complexes — no units/sides in reps (use planned.notes)
- Target: number = absolute load; string ending in % = percentage; unit required (kg, lb, m, yd)
- Status: planned | completed | skipped (builders use planned)

I/O (fixed paths — do not pass file paths):

- Plan.load() — reads current_plan.json seed or empty template
- plan.save() — writes output/plan.json

Conventions:

- Build: Plan(name).add_week(Week().add_day(Day().add_exercise(...)))
- add_exercise → 1-exercise block; add_superset(*exercises) → superset
- Exercise.add_set / add_sets before navigating refs on new work
- Edit: plan.week(0).day(0).block(0).exercise(0).set(0).update(...)
- day.exercise(n) works across blocks; all indices are 0-based
