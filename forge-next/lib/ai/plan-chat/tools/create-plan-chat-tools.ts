import { tool } from "ai";
import { z } from "zod";
import { listSessionUploads } from "@/lib/uploads/list-session-uploads";
import { loadUploadContextById } from "@/lib/uploads/context-storage";
import { SESSION_UPLOAD_READ_MAX_CHARS } from "@/lib/ai/plan-chat/constants";

export type SubmitPlanCodeInput = {
  python: string;
  assignmentId?: string;
};

export type PlanChatToolsContext = {
  coachId: string;
  sessionId: string;
  onSubmitPlanCode: (input: SubmitPlanCodeInput) => void;
};

function truncateSessionUploadText(
  text: string,
): { content: string; truncated: boolean } {
  if (text.length <= SESSION_UPLOAD_READ_MAX_CHARS) {
    return { content: text, truncated: false };
  }

  return {
    content: `${text.slice(0, SESSION_UPLOAD_READ_MAX_CHARS)}\n\n[truncated]`,
    truncated: true,
  };
}

export function createPlanChatTools(ctx: PlanChatToolsContext) {
  return {
    list_session_files: tool({
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

    read_session_file: tool({
      description:
        "Read normalized upload text for one path from list_session_files.",
      inputSchema: z.object({
        path: z.string().min(1).describe("Storage object path."),
      }),
      execute: async ({ path }) => {
        const text = await loadUploadContextById(path, ctx.coachId);
        if (text === null) {
          return { ok: false as const, error: "FILE_NOT_FOUND" };
        }

        const { content, truncated } = truncateSessionUploadText(text);
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
        "Submit the full Python source for run.py to create or update the workout plan. When editing an assigned plan, include assignmentId from set_current_artifact. When the user already specified program scope (weeks, days per week, etc.), implement the entire requested structure in this one script (use loops); do not stop after week 1 or day 1 and ask to continue. Server runs sandbox after this turn.",
      inputSchema: z.object({
        python: z
          .string()
          .min(1)
          .describe(
            "Complete run.py body: load seed, build all requested weeks/days/exercises, write output/plan.json.",
          ),
        assignmentId: z
          .string()
          .uuid()
          .optional()
          .describe(
            "Active assignment id when editing an athlete's in-progress plan.",
          ),
      }),
      execute: async ({ python, assignmentId }) => {
        ctx.onSubmitPlanCode({ python, assignmentId });
        return {
          ok: true as const,
          message: "Code queued. The server will run the sandbox after this turn.",
        };
      },
    }),
  };
}
