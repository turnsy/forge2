import type { PlanChatEvent } from "@/lib/ai/plan-chat/types";
import type { ChatEvent } from "@/lib/chat/types";
import type { WorkoutPlan } from "@/lib/plans/workout-plan";

/** Maps plan-chat SSE wire events to generic client chat events. */
export function mapPlanWireEvent(event: PlanChatEvent): ChatEvent<WorkoutPlan> {
  switch (event.type) {
    case "assistantTextDelta":
      return event;
    case "runStatus":
      return event;
    case "artifact":
      return {
        type: "artifact",
        artifact: event.plan,
        title: event.plan.name,
      };
    case "warnings":
      return event;
    case "errors":
      return event;
    case "clearArtifact":
      return event;
  }
}
