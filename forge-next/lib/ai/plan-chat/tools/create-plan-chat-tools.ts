import { tool } from "ai";
import { z } from "zod";
import { listDraftUploads } from "@/lib/uploads/list-draft-uploads";
import type { DraftUploadListItem } from "@/lib/uploads/list-draft-uploads";
import { loadUploadContextById } from "@/lib/uploads/context-storage";
import { PLAN_CHAT_DRAFT_READ_MAX_CHARS } from "@/lib/ai/plan-chat/constants";

export type PlanChatToolsContext = {
  coachId: string;
  draftId?: string;
  contextFileIds?: string[];
  onSubmitPlanCode: (python: string) => void;
};

function filterDraftItems(
  items: DraftUploadListItem[],
  contextFileIds: string[] | undefined,
): DraftUploadListItem[] {
  if (!contextFileIds?.length) {
    return items;
  }

  const allowed = new Set(contextFileIds);
  return items.filter((item) => allowed.has(item.path));
}

function truncateDraftText(text: string): { content: string; truncated: boolean } {
  if (text.length <= PLAN_CHAT_DRAFT_READ_MAX_CHARS) {
    return { content: text, truncated: false };
  }

  return {
    content: `${text.slice(0, PLAN_CHAT_DRAFT_READ_MAX_CHARS)}\n\n[truncated]`,
    truncated: true,
  };
}

export function createPlanChatTools(ctx: PlanChatToolsContext) {
  return {
    list_draft_files: tool({
      description:
        "List normalized upload files for this draft workspace (one .txt per CSV/PDF object or per XLSX sheet).",
      inputSchema: z.object({}),
      execute: async () => {
        if (!ctx.draftId) {
          return { files: [] as DraftUploadListItem[] };
        }

        const items = await listDraftUploads(ctx.coachId, ctx.draftId);
        const filtered = filterDraftItems(items, ctx.contextFileIds);
        return {
          files: filtered.map((item) => ({
            path: item.path,
            name: item.name,
            sizeBytes: item.sizeBytes,
          })),
        };
      },
    }),

    read_draft_file: tool({
      description:
        "Read normalized text for one draft upload. Use path from list_draft_files.",
      inputSchema: z.object({
        path: z.string().min(1).describe("Storage object path (contextFileId)."),
      }),
      execute: async ({ path }) => {
        if (!ctx.draftId) {
          return { ok: false as const, error: "NO_DRAFT_ID" };
        }

        const text = await loadUploadContextById(path, ctx.coachId);
        if (text === null) {
          return { ok: false as const, error: "FILE_NOT_FOUND" };
        }

        const { content, truncated } = truncateDraftText(text);
        return {
          ok: true as const,
          path,
          content,
          truncated,
        };
      },
    }),

    submit_plan_code: tool({
      description:
        "Submit Python source for run.py to create or update the workout plan. Server runs sandbox after this turn.",
      inputSchema: z.object({
        python: z.string().min(1).describe("Full run.py body."),
      }),
      execute: async ({ python }) => {
        ctx.onSubmitPlanCode(python);
        return {
          ok: true as const,
          message: "Code queued. The server will run the sandbox after this turn.",
        };
      },
    }),
  };
}
