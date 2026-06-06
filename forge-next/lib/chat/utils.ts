export function createDraftId(): string {
  return crypto.randomUUID();
}

/**
 * Human-readable label for an uploaded attachment after contextFileIds are known.
 */
export function formatAttachmentDisplayLabel(
  filename: string,
  contextFileIdCount: number,
): string {
  if (contextFileIdCount <= 1) {
    return filename;
  }

  const extension = filename.includes(".")
    ? filename.slice(filename.lastIndexOf("."))
    : "";
  const stem = extension ? filename.slice(0, -extension.length) : filename;

  return `${stem}${extension} (${contextFileIdCount} sheets)`;
}
