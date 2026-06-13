# Backlog

## Temporary restrictions (remove with feature flags)

- [ ] Replace coach prompt email allowlist (`lib/prompts/prompt-beta-access.ts`) with proper feature flags; remove `promptEnabled` prop plumbing and the `POST /api/coach/plan-chat` gate
- [ ] Re-enable prompt `@` mention menu on mobile (`PromptComposer` currently hides mentions when `useIsMobile()` is true)

## Error handling

- [ ] Migrate remaining domains to `lib/errors/service-error.ts` (`repository` read results, upload handlers, plan-chat orchestrator codes, auth responses)

Plan persistence (`lib/plans/mutations.ts`, plan API routes) uses the shared module as of the plan-persistence work.
