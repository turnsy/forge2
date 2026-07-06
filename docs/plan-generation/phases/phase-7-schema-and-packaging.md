# Phase 7 — Schema guard & Python packaging

**Goal:** Keep `forge_plan` aligned with `workout-plan.schema.json` and improve how the library is bundled into sandboxes.

**Depends on:** Phase 4 (Vercel Sandbox + Python builder)

**Blocks:** Nothing critical for v1 plan-chat; reduces drift risk before schema 2.1.0+

---

## Agent actions

### Schema version CI

- [ ] CI check: `forge_plan.builders.SCHEMA_VERSION` (and any TS empty-seed constants) must equal `forge-next/schemas/workout-plan.schema.json` → `properties.schemaVersion.const`
- [ ] Wire into `pnpm generate:check` or a dedicated `pnpm check:schema-version` run in CI
- [ ] Fail PRs when schema version bumps without updating Python/TS constants

### Python package location / faster sandbox load

- [ ] Evaluate moving `forge_plan` to a dedicated package path (e.g. `packages/forge-plan-py/`) or prebuilt sandbox snapshot with the library baked in
- [ ] Document tradeoffs: git-source `Sandbox.create({ source })` vs per-run `writeFiles` bundle
- [ ] If snapshot approach wins, add developer docs for creating/updating the snapshot

---

## Developer actions

- [ ] Review CI failure messages when schema version drifts
- [ ] If snapshot bundling is adopted, validate Sandbox quota/latency improvement locally

---

## Done criteria

- [ ] CI fails on schema version mismatch between JSON Schema and `forge_plan`
- [ ] Decision recorded (stay co-located vs package vs snapshot) with updated docs in `forge-next/sandbox/forge_plan/README.md`

---

## Out of scope (later)

- Athlete-specific **basis** resolution for percentage loads (app/reference-maxes layer, not sandbox v1)
