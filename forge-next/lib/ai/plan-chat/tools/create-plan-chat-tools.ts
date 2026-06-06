import { tool } from "ai";
import { z } from "zod";
import { listSessionUploads } from "@/lib/uploads/list-session-uploads";
import { loadUploadContextById } from "@/lib/uploads/context-storage";
import { PLAN_CHAT_DRAFT_READ_MAX_CHARS } from "@/lib/ai/plan-chat/constants";

export type PlanChatToolsContext = {
  coachId: string;
  sessionId: string;
  onSubmitPlanCode: (python: string) => void;
};

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
        "List storage paths for normalized upload files in this session (one .txt per CSV/PDF or per XLSX sheet).",
      inputSchema: z.object({}),
      execute: async () => {
        const items = await listSessionUploads(ctx.coachId, ctx.sessionId);
        return {
          paths: items.map((item) => item.path).filter((path) => path.length > 0),
        };
      },
    }),

    read_draft_file: tool({
      description:
        "Read normalized upload text for one path from list_draft_files.",
      inputSchema: z.object({
        path: z.string().min(1).describe("Storage object path."),
      }),
      execute: async ({ path }) => {
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
        "Submit the full Python source for run.py to create or update the workout plan. When the user already specified program scope (weeks, days per week, etc.), implement the entire requested structure in this one script (use loops); do not stop after week 1 or day 1 and ask to continue. Server runs sandbox after this turn.",
      inputSchema: z.object({
        python: z
          .string()
          .min(1)
          .describe(
            "Complete run.py body: load seed, build all requested weeks/days/exercises, write output/plan.json.",
          ),
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
