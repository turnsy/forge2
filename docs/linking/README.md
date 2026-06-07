# Coach–athlete linking — implementation guide

Invite-code flow: coach shares code → athlete requests link → coach accepts → either party can unlink.

## Start here

- **[overview.md](./overview.md)** — architecture, data model, RPCs, UX decisions
- **Phases** (build in order):
  1. [Data model & RPCs](./phase_1_data_model.md)
  2. [Domain layer (`lib/links`)](./phase_2_domain_layer.md)
  3. [Coach invite modal](./phase_3_coach_invite_modal.md)
  4. [Athlete link flow](./phase_4_athlete_link_flow.md)
  5. [Coach pending invites](./phase_5_coach_pending_accept.md)
  6. [Unlink](./phase_6_unlink.md)
  7. [Tests & QA](./phase_7_tests_qa.md)

## Key paths

| Area | Location |
| --- | --- |
| Migration | `supabase/migrations/*_coach_link_pending.sql` |
| Domain | `forge-next/lib/links/` |
| Coach UI | `forge-next/app/coach/(app)/athletes/`, `forge-next/components/` |
| Athlete UI | `forge-next/app/athlete/page.tsx` |
