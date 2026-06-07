"use client";

import { ViewTransition } from "react";
import type { ReactNode } from "react";
import {
  ROUTE_TRANSITION_BACK,
  ROUTE_TRANSITION_FORWARD,
} from "@/lib/motion/route-transitions";

const routeTransitionMapping = {
  [ROUTE_TRANSITION_FORWARD]: ROUTE_TRANSITION_FORWARD,
  [ROUTE_TRANSITION_BACK]: ROUTE_TRANSITION_BACK,
  default: "none",
} as const;

export function CoachRouteTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition
      enter={routeTransitionMapping}
      exit={routeTransitionMapping}
      default="none"
    >
      {children}
    </ViewTransition>
  );
}
