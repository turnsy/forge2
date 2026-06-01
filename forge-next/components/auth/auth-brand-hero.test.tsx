import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AuthBrandHero } from "@/components/auth/auth-brand-hero";

describe("AuthBrandHero", () => {
  it("renders Forge title", () => {
    render(<AuthBrandHero />);

    expect(screen.getByRole("heading", { level: 1, name: "Forge" })).toBeInTheDocument();
  });
});
