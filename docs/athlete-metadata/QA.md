# Manual QA: custom athlete profiles

Use a QA Supabase database with `20261029140910_athlete_metadata.sql` applied and a build of this branch. Prepare Coach A, Coach B, three athlete accounts, and a saved training plan. Keep a coach window and an athlete window open in separate browser profiles.

## Coach field editor

- [ ] As Coach A, open Settings. Confirm the empty state, then add fields for Sports (multiple select: Football/Basketball), Birth date (date, marked for age filtering), Weight (number, kg), a text field, a yes/no field, and a single-select field. Use arbitrary names/options; confirm no starter templates are imposed.
- [ ] Make Sports and Birth date required. Confirm the save result reports the affected athlete count and the Athletes page shows an incomplete-profile warning. Existing links and plans still work.
- [ ] Edit labels/descriptions/order and reload. Fields and existing answers retain their identities. Add and retire a select option; confirm the option history is preserved.
- [ ] Set numeric bounds/decimal places and a text-length limit. Invalid entries produce errors and valid entries persist. False and zero count as answered; blank/cleared answers count as missing.

## Hybrid onboarding and human answer editors

- [ ] Enter Coach A's invite code as an unlinked athlete. Coach questions appear before submitting the link request. An invalid code shows a retryable error.
- [ ] Fill only some questions and submit. The request remains pending with incomplete answers; no required-field browser validation blocks submission. Also test “Submit and complete later.”
- [ ] While pending, change an answer from the athlete home page. Coach A opens Athletes → Pending invites → Review profile and sees the answer.
- [ ] Coach A fills a missing answer, saves, then accepts. The athlete sees the saved values in Settings → Athlete profile.
- [ ] Accept another athlete without filling required answers. Acceptance succeeds, the roster warning remains accurate, and a plan can still be assigned and used.
- [ ] Edit/clear values from the coach athlete Profile tab and from athlete Settings. Reload both windows; changes agree. Open change history to see actor, time, and prior entries.
- [ ] Set Weight to 60 kg, then 55 kg. Both entries remain in history. In coach field settings change kg to lb (adjust bounds in the new unit if configured). The current value converts to about 121.25 lb; older entries still show kg. An incompatible change to cm fails without changing data.
- [ ] Open an answer form in one window and rename its field in another. Saving the old form shows a refresh/retry error and does not overwrite answers. Reload and retry successfully.
- [ ] Try changing a field with saved answers to an incompatible type. It fails with guidance to archive/create a replacement. Archive the field; it disappears from active forms/completion while its logged values remain in history.

## Chat parity and continuation

- [ ] Tell the coach agent, “Let me edit my athlete profile fields here.” Confirm the shared field editor opens inside chat. Create or edit a required field, save, and continue. The agent reports the affected athlete count using current data.
- [ ] With incomplete pending athletes, say, “Accept the athletes waiting to join.” The agent raises missing fields and offers inline editing or acceptance with completion later. It must not invent answers.
- [ ] Fill/save an athlete's answers inside chat and press Continue. The agent resumes the original acceptance request without requiring you to repeat it. Check the regular Profile editor for the same values.
- [ ] Choose to accept and complete later. Acceptance succeeds even with missing fields.
- [ ] Cancel a pending chat request. No further acceptance/assignment happens. Any profile edits you explicitly saved before cancelling remain saved, as stated on the card.
- [ ] Reopen an old conversation after changing values elsewhere. Historical editor cards stay closed; asking for current information fetches the latest values.

## Filtering and plan assignment

- [ ] Configure one athlete as Football aged 14, one as Basketball aged 14, and one as Football aged 16 (derive birth dates relative to today's date). Include an athlete who plays both sports if available.
- [ ] On Athletes, combine Sports → any → Football and Birth date → age between → 12 and 15. Only eligible athletes appear. The dual-sport athlete matches Football.
- [ ] Check numeric ranges, text contains, yes/no equality, missing/answered, and the “Missing required fields only” filter. Clear filters/search and confirm the roster's plan actions, joined date, and progress still work.
- [ ] Say, “Assign [plan name] to all my football athletes aged 12 to 15.” The agent resolves the current field/option definitions, reviews matching athletes, and assigns only confirmed IDs. Age 16 and athletes whose eligibility cannot be determined are excluded; missing information is surfaced rather than guessed.
- [ ] If the QA roster exceeds one result page, confirm the agent considers every page before assigning. New athletes matching later are not automatically enrolled.

## Coach isolation and regression checks

- [ ] Coach B cannot see or edit Coach A's definitions, answers, or history. An athlete cannot edit another athlete's answers or change coach field definitions.
- [ ] Unlink an athlete from Coach A and link them to Coach B. Coach B's fields appear without Coach A's answers carrying over.
- [ ] Confirm normal acceptance/rejection/unlinking, maxes editing, plan assignment, and athlete plan use still work on desktop and mobile layouts.
