# Chat action confirmations

Use `defineConfirmedForgeTool` for a mutation that needs a target selection and
approval. It preserves Eve's native approval requirement while combining both
interactions in one card.

## Proposal and execution

The tool's model-facing input is an envelope:

```ts
{
  confirmationId: "a-new-uuid",
  prompt: "Who should receive General Strength? This replaces their current plan.",
  choices: [
    { id: "candidate-1", label: "Jay", description: "Currently assigned Base",
      input: { planId: "...", athleteIds: ["..."] } },
    { id: "candidate-2", label: "Jay (Athlete)", description: "Currently assigned Strength",
      input: { planId: "...", athleteIds: ["..."] } }
  ]
}
```

Each choice contains the complete action input, validated against the tool's
original schema. The agent proposes all matching candidates in one tool call;
it must not ask a separate clarification question for that action first.

Selecting a row only updates local selection. Confirm sends one native Eve
approval response with the proposal id, tool name, and choice id in `text`.
Cancel sends a denial. Neither action adds a trailing Forge context message.

The authenticated coach channel captures approved selections from the request
body into runtime auth attributes. The tool resolves the selection against its
original proposal and runs only that choice's validated input. Model-authored
context and persisted UI snapshots cannot authorize an action. Native Eve
approval and existing repository authorization remain enforced. Consumed
confirmation ids cannot execute again in the session; retries require a new
proposal and a new confirmation.

## Persistent card

`input.requested` inserts a card into the message timeline at that event's
position. Confirmation locks its controls while the action runs. The tool's
result includes the selected choice id, letting replay reconstruct the same
completed or failed card before subsequent assistant messages.

Selections are also saved in `inputCardResponses` as soon as Eve acknowledges
the POST. This retains the selected row during reloads before tool completion,
and on cancellation or terminal failure. These fields are presentation data,
not execution grants. Only a tool result can mark an action completed.

Pending, submitted, completed, cancelled, and failed cards use the same
component. All controls remain present and disabled after submission. A new
conversation is required to use the new envelope for conversations compiled
against the older mutation-tool schemas.
