const LINK_ERROR_MESSAGES: Record<string, string> = {
  "Invalid invite code": "That invite code is not valid. Check the code and try again.",
  "Already linked to a coach": "You are already linked to a coach.",
  "Pending request already exists": "You already have a pending request with a coach.",
  "Only athletes can request a coach link": "Only athlete accounts can use invite codes.",
  "Pending request not found": "That pending request could not be found.",
  "Pending invite not found": "That pending invite could not be found.",
  "Active link not found": "That active link could not be found.",
  "Not authenticated": "You must be signed in to continue.",
};

export function normalizeLinkError(message: string): string {
  const trimmed = message.trim();

  for (const [key, value] of Object.entries(LINK_ERROR_MESSAGES)) {
    if (trimmed.includes(key)) {
      return value;
    }
  }

  return trimmed || "Something went wrong. Please try again.";
}
