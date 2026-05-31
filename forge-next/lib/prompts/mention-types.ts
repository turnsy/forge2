export type PromptMentionItem =
  | { kind: "athlete"; id: string; label: string }
  | { kind: "plan"; id: string; label: string };

export type PromptMentionSegment = {
  type: "mention";
  kind: "athlete" | "plan";
  id: string;
  label: string;
};

export type PromptTextSegment = { type: "text"; value: string };

export type PromptSegment = PromptTextSegment | PromptMentionSegment;

export type ActiveMentionQuery = {
  start: number;
  query: string;
  end: number;
};
