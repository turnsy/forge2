/**
 * Optional fuzzy sheet matching from user prompt text.
 * Upload (Phase 2 revision) exports all sheets; plan-chat tools list/read drafts instead.
 */

export type XlsxSheetSelection =
  | { ok: true; sheetName: string }
  | { ok: false; needsClarification: true; sheets: string[] };

function normalizeForMatch(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

const MIN_FUZZY_SHEET_NAME_LENGTH = 3;

function scoreSheetMatch(sheetName: string, promptText: string): number {
  const sheet = normalizeForMatch(sheetName);
  const prompt = normalizeForMatch(promptText);
  if (!sheet || !prompt) {
    return 0;
  }

  if (sheet.length >= MIN_FUZZY_SHEET_NAME_LENGTH) {
    if (prompt.includes(sheet) || sheet.includes(prompt)) {
      return sheet.length + 10;
    }
  }

  const sheetTokens = sheet.split(" ").filter(
    (token) => token.length >= MIN_FUZZY_SHEET_NAME_LENGTH,
  );
  return sheetTokens.reduce(
    (score, token) => (prompt.includes(token) ? score + token.length : score),
    0,
  );
}

export function selectXlsxSheet(
  sheetNames: string[],
  promptText?: string,
): XlsxSheetSelection {
  const names = sheetNames.filter((name) => name.trim().length > 0);
  if (names.length === 0) {
    return {
      ok: false,
      needsClarification: true,
      sheets: [],
    };
  }

  if (names.length === 1) {
    return { ok: true, sheetName: names[0]! };
  }

  const prompt = promptText?.trim() ?? "";
  if (prompt) {
    let bestName: string | null = null;
    let bestScore = 0;

    for (const name of names) {
      const score = scoreSheetMatch(name, prompt);
      if (score > bestScore) {
        bestScore = score;
        bestName = name;
      }
    }

    if (bestName && bestScore > 0) {
      return { ok: true, sheetName: bestName };
    }
  }

  return {
    ok: false,
    needsClarification: true,
    sheets: names,
  };
}
