export const FADE_IN_DURATION_MS = 450;
export const STAGGER_STEP_MS = 70;

export function staggerDelayMs(index: number): number {
  return index * STAGGER_STEP_MS;
}
