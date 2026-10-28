# Chat selections and confirmations

All choices use Eve's `ask_question` tool. The agent sets `selectionMode` to
`single` (the default) or `multiple`, supplies concrete options, and sets
`allowFreeform: false`. This controls the choices on the card; the chat composer
is always an alternative response path. Any future question can use this: athletes, plans,
training days, exercise preferences, or other choices need no new UI wrapper.

```ts
{
  prompt: "Assign General Strength to which athletes? This replaces their current plans.",
  selectionMode: "multiple",
  allowFreeform: false,
  options: [
    { id: "athlete-1", label: "Jay", description: "Current plan: Base" },
    { id: "athlete-2", label: "Jane", description: "Current plan: Strength" }
  ]
}
```

The pinned Eve package patch adds the optional `selectionMode` field to the
framework question schema. Eve already preserves it in `request.action.input`,
so no new transport fields or fork of its input lifecycle are needed. The patch
also retains the independent stream-cleanup fix documented in eve-stream-cleanup.md.

## Interaction and model guidance

Single choices use radio buttons; multiple choices use checkboxes. Selecting a
row changes only local state. Confirm is enabled when at least one option is
selected. Confirm and Cancel always remain in the same card; candidate lists
do not include a custom textbox. Questions with no candidates can still request
an open text answer.

The standard Eve `InputResponse.text` contains:

```json
{
  "status": "confirmed",
  "selections": [
    { "id": "athlete-1", "label": "Jay" },
    { "id": "athlete-2", "label": "Jane" }
  ]
}
```

Cancel sends `status: "cancelled"`, retaining the selected rows for display.
Single-choice responses also include Eve's `optionId` for compatibility.
Input-only continuations do not append Forge client context to model history.

`agent/instructions/user-choices.ts` tells the model to describe the proposed
operation and consequences in the question, treat Confirm as sufficient
direction, and proceed without another confirmation. It must acknowledge Cancel
and not perform the proposed operation. Plan assignment already supports several
athletes in one call; link operations accept one relationship per call.

These are conversational instructions, not an exact-arguments authorization
contract. The action tools use their ordinary schemas and authenticated database
context. Coach authentication, role checks, linked-athlete permissions, input
schemas, and repository/RLS checks remain enforced. Adding another action does
not require a confirmation wrapper. Eve's generic native approvals remain
renderable for capabilities that independently require them.

## Replies through chat

While input is pending, the coach can send a normal chat message instead of
pressing Confirm or Cancel. The same Eve continuation carries that visible
message and an `inputResponses` entry for every pending request. Each entry's
`text` contains `status: "replied"`, the written `message`, current `selections`,
any valid numeric `maxes`, raw numeric `fieldValues`, and `draftText` when an
open text field had a draft. Draft values are context, not confirmation; the
written message takes precedence. No client-side intent classifier runs.

The agent instructions explain how to interpret direct answers, additions to
checked choices, clear approvals, revisions, and changes of direction. Resolve
only the remaining ambiguity; do not require a card click, announce a
cancellation, or produce an intermediate cancellation response. A single
message resolves the current batch, with missing answers handled by a new
question if needed.

A chat-resolved card stays in the timeline, greyed out with draft values
preserved and no accepted/cancelled/completed label. Responses are persisted
only after POST acknowledgement and restore this neutral presentation on reload.
Failed deliveries retain pending requests so the coach can retry through either
path. Explicit UI Confirm/Cancel responses keep their existing behavior.

Eve's native tool approvals are distinct from conversational `ask_question`
cards. A typed revision resolves the native approval without executing its old
arguments, then Eve delivers the message for reconsideration. It must not be
classified into an authorization grant by the UI. The normal native approval
requirements remain enforced. Input-only and native-approval continuations omit
Forge client context to preserve AI SDK tool-response ordering; combined
conversational replies can carry the current client artifact as usual.

## Persistent card

`input.requested` inserts a card at that point in the timeline. Submitted cards
remain in place with both buttons and all selections disabled. The next turn
marks a question completed; cancellation stays cancelled. Completed refers to
the question being answered, not a guarantee that a later mutation succeeded.
Tool successes or failures are reported by the agent separately.

Selections are saved in `inputCardResponses` when Eve acknowledges the POST,
which restores all selected rows on reload, including cancellation and failures.
Use a new conversation when testing this deployment: older sessions may still
carry pending calls using the superseded proposal-envelope tool schemas.

## Optional max inputs before assignment

The agent checks `check_plan_maxes` for the selected athletes before assignment.
Only percentage prescriptions need coverage, using the explicit basis exercise
when present. Missing maxes produce `maxInputs` that can be passed directly into
`ask_question`; they render numeric kg/lb inputs in the same confirmation card.
The field contract is `forge-next/schemas/training-max-fields.schema.json`, embedded
in the pinned Eve question schema and checked by `scripts/check-question-schema.mjs`.

Every value is optional. Confirm with blank values means continue without them;
Cancel means neither record values nor assign. Filled values are returned in the
standard `InputResponse.text` JSON as `maxes`, each with the checked athlete and
exercise IDs. This is steering, not an assignment gate or an authorization grant.
The agent records supplied values with `set_athlete_max` (append-only coach entries)
and then assigns without a second confirmation. Existing values are not judged by
age or plausibility. Input values and units restore on disabled answered cards.

Desktop Enter sends chat; Shift+Enter inserts a newline. Mobile Enter inserts a
newline, and IME composition never submits a message.
