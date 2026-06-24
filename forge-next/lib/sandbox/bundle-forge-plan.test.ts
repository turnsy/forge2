import { describe, expect, it } from "vitest";
import { bundleForgePlanFiles } from "@/lib/sandbox/bundle-forge-plan";

describe("bundleForgePlanFiles", () => {
  it("includes core library modules", () => {
    const files = bundleForgePlanFiles();
    const paths = files.map((file) => file.path);

    expect(paths).toContain("forge_plan/__init__.py");
    expect(paths).toContain("forge_plan/plan.py");
    expect(paths).toContain("forge_plan/builders.py");
    expect(paths).toContain("forge_plan/target.py");
    expect(paths).toContain("forge_plan/ids.py");
    expect(paths).toContain("forge_plan/schema_rules.py");
    expect(paths).not.toContain("forge_plan/test_forge_plan.py");
    expect(paths).not.toContain("forge_plan/test_schema_rules.py");
    expect(paths).not.toContain("forge_plan/README.md");
  });
});
