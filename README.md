# forge2

Initial workout-plan schema work lives in:

- `schemas/workout-plan.schema.json`
- `examples/workout-plan.example.json`

The schema is week/day based (`w1d1`, `w1d2`, etc.) and supports:

- set/rep prescriptions
- percentage-based loads tied to a reference max
- absolute loads with `value` + `unit`
- target-style instructions such as "work up to 3x5" or "3RM"
