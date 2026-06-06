# Phase 1 — Data model & RPCs

**Status:** 🚧 In progress

**Goal:** Add `pending`/`active` link status, secure RPCs for all link mutations, tighten RLS.

**Depends on:** Existing `profiles.invite_code` and `coach_athletes` table

**Blocks:** Phases 2–7

---

## Agent actions

- [ ] Migration `supabase/migrations/*_coach_link_pending.sql`:
  - `coach_link_status` enum (`pending`, `active`)
  - `coach_athletes.status` column (backfill existing → `active`)
  - `linked_at` nullable (set on accept)
  - Replace partial unique index for one active coach per athlete
  - Add partial unique index for one pending request per athlete
  - RPCs: `request_coach_link`, `cancel_coach_link_request`, `accept_coach_link`, `reject_coach_link`, `unlink_coach_athlete`, `get_athlete_coach_link`, `get_coach_pending_invites`, `count_coach_pending_invites`
  - Update `get_coach_athletes` to filter `status = 'active'`
  - Drop open `coach_athletes: athlete insert` policy (mutations via RPC only)
- [ ] Manually update `forge-next/lib/database.types.ts` for new enum, column, and RPCs

---

## Done criteria

- [ ] Migration applies cleanly on fresh + existing DB
- [ ] Athletes cannot insert `coach_athletes` directly
- [ ] All link lifecycle transitions go through RPCs with role checks
