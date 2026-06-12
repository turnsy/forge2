import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRequestCoachLink = vi.fn();
const mockCancelCoachLinkRequest = vi.fn();
const mockAcceptCoachLink = vi.fn();
const mockRejectCoachLink = vi.fn();
const mockUnlinkCoachAthlete = vi.fn();
const mockRevalidatePath = vi.fn();

vi.mock("next/cache", () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}));

vi.mock("@/lib/links/repository", () => ({
  requestCoachLink: (...args: unknown[]) => mockRequestCoachLink(...args),
  cancelCoachLinkRequest: (...args: unknown[]) => mockCancelCoachLinkRequest(...args),
  acceptCoachLink: (...args: unknown[]) => mockAcceptCoachLink(...args),
  rejectCoachLink: (...args: unknown[]) => mockRejectCoachLink(...args),
  unlinkCoachAthlete: (...args: unknown[]) => mockUnlinkCoachAthlete(...args),
}));

import {
  acceptCoachLinkAction,
  cancelCoachLinkRequestAction,
  rejectCoachLinkAction,
  requestCoachLinkAction,
  unlinkCoachAthleteAction,
} from "@/lib/links/actions";

describe("link actions", () => {
  beforeEach(() => {
    mockRequestCoachLink.mockReset();
    mockCancelCoachLinkRequest.mockReset();
    mockAcceptCoachLink.mockReset();
    mockRejectCoachLink.mockReset();
    mockUnlinkCoachAthlete.mockReset();
    mockRevalidatePath.mockReset();
  });

  it("rejects empty invite codes", async () => {
    const formData = new FormData();
    formData.set("inviteCode", "   ");

    const result = await requestCoachLinkAction(null, formData);

    expect(result).toEqual({
      ok: false,
      error: "That invite code is not valid. Check the code and try again.",
    });
    expect(mockRequestCoachLink).not.toHaveBeenCalled();
  });

  it("requests a coach link and revalidates athlete page", async () => {
    mockRequestCoachLink.mockResolvedValue("rel-1");
    const formData = new FormData();
    formData.set("inviteCode", "abc12345");

    const result = await requestCoachLinkAction(null, formData);

    expect(result).toEqual({ ok: true });
    expect(mockRequestCoachLink).toHaveBeenCalledWith("abc12345");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/athlete");
  });

  it("maps repository errors for link requests", async () => {
    mockRequestCoachLink.mockRejectedValue(new Error("Already linked to a coach"));
    const formData = new FormData();
    formData.set("inviteCode", "abc12345");

    const result = await requestCoachLinkAction(null, formData);

    expect(result).toEqual({
      ok: false,
      error: "You are already linked to a coach.",
    });
  });

  it("cancels a pending request", async () => {
    const result = await cancelCoachLinkRequestAction("rel-1");

    expect(result).toEqual({ ok: true });
    expect(mockCancelCoachLinkRequest).toHaveBeenCalledWith("rel-1");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/athlete");
  });

  it("accepts a pending invite and revalidates coach and athlete pages", async () => {
    const result = await acceptCoachLinkAction("rel-1");

    expect(result).toEqual({ ok: true });
    expect(mockAcceptCoachLink).toHaveBeenCalledWith("rel-1");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/coach/athletes");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/coach/athletes/pending");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/athlete");
  });

  it("rejects a pending invite", async () => {
    const result = await rejectCoachLinkAction("rel-1");

    expect(result).toEqual({ ok: true });
    expect(mockRejectCoachLink).toHaveBeenCalledWith("rel-1");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/coach/athletes/pending");
  });

  it("unlinks an active relationship", async () => {
    const result = await unlinkCoachAthleteAction("rel-1");

    expect(result).toEqual({ ok: true });
    expect(mockUnlinkCoachAthlete).toHaveBeenCalledWith("rel-1");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/athlete");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/athlete/plan");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/athlete/settings");
  });
});
