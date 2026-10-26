# Eve 0.18.2 stream cleanup patch

`forge-next/patches/eve@0.18.2.patch` changes client-side NDJSON cleanup to
request cancellation without awaiting the transport's cancellation promise.
It still catches cancellation errors and releases the reader lock.

Eve stops consuming a turn after its real `session.waiting`, `session.completed`,
or `session.failed` event. Previously, if cancellation of the still-open durable
stream never settled, the reader's `finally` blocked the session cursor update
and agent store completion. The visible reply was finalized but the store
remained `streaming`, leaving Thinking/Stop visible and blocking another send.

The patch does not infer completion from text, manufacture boundary events,
skip event indexes, or reset the conversation. Installation uses the repository's
pnpm 10 frozen lockfile and normal package integrity verification.

Regression coverage in `eve-stream-cleanup.test.ts` uses the real Eve client and
agent store with a cancellation promise that never resolves. It verifies two
completed turns, correct cursors, released reader locks, and readiness for the
next send. A separate case verifies that reply text alone does not finish a turn.

When updating Eve, check whether upstream cleanup has changed. Remove this patch
only after the unpatched version passes these regression cases.
