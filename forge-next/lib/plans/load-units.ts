export const PRESET_LOAD_UNITS = ["kg", "lb", "m", "yd"] as const;

export const CUSTOM_LOAD_UNIT_OPTION = "__custom__";

export function isPresetLoadUnit(unit: string): boolean {
  return (PRESET_LOAD_UNITS as readonly string[]).includes(unit);
}
