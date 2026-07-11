export function buildNoSessionUploadsInstructions(): string {
  return "No session uploads are registered for this conversation. You may still call submit_plan_code for prompt-only plans.";
}

export function buildSessionUploadsPresentInstructions(paths: string[]): string {
  const pathLines = paths.map((path) => `- ${path}`).join("\n");

  return [
    "The coach has attached file(s) to this conversation. Normalized source text is available at:",
    pathLines,
    "",
    'When they ask to build, create, or generate a plan from an attachment, spreadsheet, or vague phrases like "from this", "from the file", "using the upload", or "based on what I attached":',
    "1. Call read_session_file for the relevant path(s) before submit_plan_code.",
    "2. Load the plan-codegen skill, then generate from that source data — do not guess from the chat text alone.",
    "3. If multiple sheets are listed and they did not say which to use, ask which sheet before generating.",
  ].join("\n");
}
