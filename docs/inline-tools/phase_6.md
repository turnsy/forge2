# Phase 6 — Workspace UI (artifact-gated split)

**Status:** Not started

**Goal:** Show split pane only when `currentArtifact` is set. Before that, chat stays centered at welcome width; after first message, thread + bottom composer. When artifact appears, chat shifts right.

**Depends on:** Phase 4 recommended (artifact can arrive via `set_current_artifact` or sandbox); can partially ship with sandbox-only artifact first

**Blocks:** None

---

## Scope

### Layout rules

| State | Layout |
| --- | --- |
| `!hasStarted` | Centered welcome + composer (`max-w-3xl`) — unchanged |
| `hasStarted && !currentArtifact` | Single column, same `max-w-3xl` centering; `ChatThread` + bottom `ChatComposer` (compact) |
| `currentArtifact` set (or `mode === 'edit'` with initial plan) | `ResizableSplitPane`: preview left, chat right |
| Plan generating, no artifact yet | Single column; loading spinners in thread only (not empty left pane) |

### `CoachWorkspace` changes

- [ ] Replace `hasStarted` → split trigger with `!!currentArtifact || (mode === 'edit' && initialPlan)`
- [ ] New layout component or branch: `CenteredChatLayout` for non-split active chat
  - [ ] Match welcome horizontal position (`mx-auto max-w-3xl`)
  - [ ] `ChatThread` flex-1 scrollable
  - [ ] `ChatComposer` pinned bottom with border-top
- [ ] Remove left-pane spinner / “Working…” placeholder from non-split state
- [ ] `ArtifactToolbar` + `ArtifactPreview` only render in split layout

### Transition behavior

- [ ] When `currentArtifact` transitions `null → plan`, mount split pane
- [ ] Chat column animates/shifts right (CSS transition on layout change — keep subtle)
- [ ] Preserve scroll position in thread where possible

### Run status / loading

- [ ] `isAwaitingFirstArtifact` spinners move to `ChatThread` only (already partially there)
- [ ] `ArtifactPreview` overlay spinner only when artifact exists + sandbox/validating

### Edit mode

- [ ] Edit route always has `initialPlan` → always split (unchanged)
- [ ] `PageBackGutter` + back link unchanged for edit

### Tests

- [ ] Component test: no split before artifact on create flow
- [ ] Component test: split after artifact event
- [ ] Component test: edit mode renders split immediately
- [ ] `workspace-selectors` tests updated if selectors change

---

## Files

| File | Action |
| --- | --- |
| `forge-next/components/coach/coach-workspace.tsx` | Layout branching |
| `forge-next/components/coach/centered-chat-layout.tsx` | New (optional extract) |
| `forge-next/components/artifact/artifact-preview.tsx` | Adjust awaiting states |
| `forge-next/lib/chat/workspace-selectors.ts` | Review/update |
| `forge-next/components/coach/coach-workspace.test.tsx` | New/extend |

---

## Done criteria

- [ ] General chat (no plan) stays single-column centered after first message
- [ ] Plan generation shows loading in thread, not empty split left pane
- [ ] Artifact appearance triggers split with chat shifting right
- [ ] Edit mode unchanged (always split)
- [ ] Component tests cover layout states
