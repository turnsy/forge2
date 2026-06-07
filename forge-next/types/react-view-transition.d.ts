import type { ExoticComponent, ReactNode } from "react";

declare module "react" {
  interface ViewTransitionProps {
    children?: ReactNode;
    default?: string;
    enter?: Record<string, string> | string;
    exit?: Record<string, string> | string;
    name?: string;
  }

  export const ViewTransition: ExoticComponent<ViewTransitionProps>;
}
