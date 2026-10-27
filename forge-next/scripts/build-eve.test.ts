import { describe, expect, it } from "vitest";
import { assertEveBuildEnvironment } from "./build-eve.mjs";

describe("Eve production build prerequisites", () => {
  it("rejects Vercel builds that would skip sandbox prewarming", () => {
    expect(() => assertEveBuildEnvironment({ VERCEL: "1", VERCEL_PROJECT_ID: "prj_test" }))
      .toThrow("missing VERCEL_DEPLOYMENT_ID");
  });

  it("rejects a missing project scope that would change template keys at runtime", () => {
    expect(() => assertEveBuildEnvironment({ VERCEL: "1", VERCEL_DEPLOYMENT_ID: "dpl_test" }))
      .toThrow("missing VERCEL_PROJECT_ID");
  });

  it("allows a Vercel source build with deployment and project identity", () => {
    expect(() => assertEveBuildEnvironment({ VERCEL: "1", VERCEL_DEPLOYMENT_ID: "dpl_test", VERCEL_PROJECT_ID: "prj_test" }))
      .not.toThrow();
  });

  it("allows local builds without Vercel deployment identity", () => {
    expect(() => assertEveBuildEnvironment({})).not.toThrow();
  });
});
