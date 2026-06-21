/** Fast/cheap model for one-shot session titles. Override with SESSION_TITLE_MODEL. */
export const SESSION_TITLE_DEFAULT_MODEL = "google/gemini-2.5-flash-lite";

export const SESSION_TITLE_MAX_CHARS = 80;

export const SESSION_TITLE_PROMPT = `You label coaching chat threads in a workout-planning app.

Write a short, specific title (3–8 words) for this conversation.
- Focus on the athlete goal, plan type, or training topic.
- Do not use quotes or trailing punctuation.
- Return only the title text.`;
