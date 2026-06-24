import { arrayMove } from "@dnd-kit/sortable";
import type { Set } from "@/lib/plans/workout-plan";

export function reorderSetsInExercise(
  sets: Set[],
  activeId: string,
  overId: string | undefined,
): Set[] {
  if (!overId || activeId === overId) {
    return sets;
  }

  const oldIndex = sets.findIndex((set) => set.id === activeId);
  const newIndex = sets.findIndex((set) => set.id === overId);

  if (oldIndex === -1 || newIndex === -1) {
    return sets;
  }

  return arrayMove(sets, oldIndex, newIndex);
}
