/**
 * Logs generated Python from submit_plan_code for local debugging.
 * Visible in the Next.js server terminal (`pnpm dev`).
 *
 * Enabled when NODE_ENV !== "production", or PLAN_CHAT_LOG_GENERATED_CODE=1.
 */
export function logSubmittedPlanCode(
  python: string,
  meta: { coachId: string; sessionId: string },
): void {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.PLAN_CHAT_LOG_GENERATED_CODE !== "1"
  ) {
    return;
  }

  const header = `[plan-chat] submit_plan_code coach=${meta.coachId} session=${meta.sessionId} (${python.split("\n").length} lines)`;

  console.info(header);
  console.info("[plan-chat] generated run.py:\n%s", python);
}
