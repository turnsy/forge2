import type { WorkoutPlan } from "@/lib/plans/workout-plan";

export type SandboxPlanArtifact = {
  type: "plan";
  currentPlan: WorkoutPlan | null;
  generatedPython: string;
};

/** Discriminated artifact payloads executed in Vercel Sandbox. */
export type SandboxArtifact = SandboxPlanArtifact;

export type RunSandboxResult =
  | { ok: true; plan: WorkoutPlan }
  | {
      ok: false;
      code: "SANDBOX_TIMEOUT" | "SANDBOX_FAILED" | "MISSING_OUTPUT";
      message: string;
    };

export type RunPlanSandboxInput = {
  currentPlan: WorkoutPlan | null;
  generatedPython: string;
};
