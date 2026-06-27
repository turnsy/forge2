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

  const header = `[eve-coach] submit_plan_code coach=${meta.coachId} session=${meta.sessionId} (${python.split("\n").length} lines)`;

  console.info(header);
  console.info("[eve-coach] generated run.py:\n%s", python);
}
