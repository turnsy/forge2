import { describe, expect, it } from "vitest";
import {
  ROUTE_TRANSITION_BACK,
  ROUTE_TRANSITION_BACK_TYPES,
  ROUTE_TRANSITION_FORWARD,
  ROUTE_TRANSITION_FORWARD_TYPES,
} from "@/lib/motion/route-transitions";

describe("route transition types", () => {
  it("defines forward and back lineage transition types", () => {
    expect(ROUTE_TRANSITION_FORWARD).toBe("nav-forward");
    expect(ROUTE_TRANSITION_BACK).toBe("nav-back");
    expect(ROUTE_TRANSITION_FORWARD_TYPES).toEqual(["nav-forward"]);
    expect(ROUTE_TRANSITION_BACK_TYPES).toEqual(["nav-back"]);
  });
});
