import { describe, expect, it } from "vitest";
import { parseAppearance, resolveAppearance } from "./appearance";

describe("appearance", () => {
  it("defaults absent or untrusted saved preferences to system", () => {
    for (const value of [null, "", "sepia", "undefined"])
      expect(parseAppearance(value)).toBe("system");
    expect(parseAppearance("dark")).toBe("dark");
    expect(parseAppearance("light")).toBe("light");
  });
  it("follows OS appearance only when system is selected", () => {
    expect(resolveAppearance("system", true)).toBe("dark");
    expect(resolveAppearance("system", false)).toBe("light");
    expect(resolveAppearance("light", true)).toBe("light");
    expect(resolveAppearance("dark", false)).toBe("dark");
  });
});
