import { describe, expect, it } from "vitest";
import type { PromptMentionItem } from "@/lib/prompts/mention-types";
import {
  createTextDocument,
  getActiveMentionQuery,
  getLinearText,
  insertMentionChip,
  isEmptyDocument,
  searchMentionItems,
  serializePromptDocument,
  updateTextAtRange,
} from "@/lib/prompts/prompt-document";

const items: PromptMentionItem[] = [
  { kind: "athlete", id: "a1", label: "Jane Smith" },
  { kind: "athlete", id: "a2", label: "John Adams" },
  { kind: "plan", id: "p1", label: "Summer Block" },
  { kind: "plan", id: "p2", label: "Winter Base" },
  { kind: "athlete", id: "a3", label: "Jamie Lee" },
];

describe("getActiveMentionQuery", () => {
  it("detects an active query at the caret", () => {
    const segments = createTextDocument("Update @ja");

    expect(getActiveMentionQuery(segments, 10)).toEqual({
      start: 7,
      query: "ja",
      end: 10,
    });
  });

  it("returns null after whitespace ends the query", () => {
    const segments = createTextDocument("@jane ");

    expect(getActiveMentionQuery(segments, 6)).toBeNull();
  });

  it("ignores email-like @ symbols", () => {
    const segments = createTextDocument("email user@example.com");

    expect(getActiveMentionQuery(segments, 18)).toBeNull();
  });
});

describe("searchMentionItems", () => {
  it("returns top matches capped at four", () => {
    expect(searchMentionItems(items, "", 4)).toHaveLength(4);
  });

  it("prefers prefix matches", () => {
    expect(searchMentionItems(items, "ja", 4).map((item) => item.label)).toEqual([
      "Jamie Lee",
      "Jane Smith",
    ]);
  });
});

describe("insertMentionChip", () => {
  it("replaces @query with a mention segment and trailing space", () => {
    const segments = createTextDocument("Hi @ja");
    const query = getActiveMentionQuery(segments, 6);

    expect(query).not.toBeNull();

    const next = insertMentionChip(segments, query!, items[0]!);

    expect(getLinearText(next)).toBe("Hi @Jane Smith ");
    expect(next).toEqual([
      { type: "text", value: "Hi " },
      {
        type: "mention",
        kind: "athlete",
        id: "a1",
        label: "Jane Smith",
      },
      { type: "text", value: " " },
    ]);
  });
});

describe("serializePromptDocument", () => {
  it("serializes text and chips to plain @Label text", () => {
    const segments = insertMentionChip(
      createTextDocument("Update @Summer"),
      { start: 7, end: 14 },
      items[2]!,
    );

    expect(serializePromptDocument(segments)).toBe("Update @Summer Block ");
  });
});

describe("isEmptyDocument", () => {
  it("treats whitespace-only documents as empty", () => {
    expect(isEmptyDocument(createTextDocument("   "))).toBe(true);
  });
});

describe("updateTextAtRange", () => {
  it("updates plain text in a document", () => {
    const segments = updateTextAtRange(createTextDocument("hi"), 2, 2, " there");

    expect(getLinearText(segments)).toBe("hi there");
  });
});
