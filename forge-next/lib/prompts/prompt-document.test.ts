import { describe, expect, it } from "vitest";
import type { PromptMentionItem } from "@/lib/prompts/mentions/types";
import {
  createTextDocument,
  getActiveMentionQuery,
  getLinearText,
  insertMentionChip,
  isEmptyDocument,
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

  it("keeps the mention active when the query contains spaces", () => {
    const segments = createTextDocument("@jane doe");

    expect(getActiveMentionQuery(segments, 9)).toEqual({
      start: 0,
      query: "jane doe",
      end: 9,
    });
  });

  it("ignores email-like @ symbols", () => {
    const segments = createTextDocument("email user@example.com");

    expect(getActiveMentionQuery(segments, 18)).toBeNull();
  });

  it("does not treat @ labels inside mention chips as active queries", () => {
    const segments = insertMentionChip(
      createTextDocument("@ja"),
      { start: 0, end: 3 },
      items[0]!,
    );

    expect(getActiveMentionQuery(segments, getLinearText(segments).length)).toBeNull();
  });
});

describe("insertMentionChip", () => {
  it("replaces @query with a mention segment and trailing space", () => {
    const segments = createTextDocument("Hi @ja");
    const query = getActiveMentionQuery(segments, 6);

    expect(query).not.toBeNull();

    const next = insertMentionChip(segments, query!, items[0]!);

    expect(getLinearText(next)).toBe("Hi @Jane Smith \u200B");
    expect(next).toEqual([
      { type: "text", value: "Hi " },
      {
        type: "mention",
        kind: "athlete",
        id: "a1",
        label: "Jane Smith",
      },
      { type: "text", value: " \u200B" },
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
