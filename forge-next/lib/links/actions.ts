"use server";

import { revalidatePath } from "next/cache";
import { normalizeLinkError } from "@/lib/links/errors";
import {
  acceptCoachLink,
  cancelCoachLinkRequest,
  rejectCoachLink,
  requestCoachLink,
  unlinkCoachAthlete,
} from "@/lib/links/repository";
import type { LinkActionResult } from "@/lib/links/types";

function failure(error: string): LinkActionResult {
  return { ok: false, error: normalizeLinkError(error) };
}

function success(): LinkActionResult {
  return { ok: true };
}

export async function requestCoachLinkAction(
  _prev: LinkActionResult | null,
  formData: FormData,
): Promise<LinkActionResult> {
  const inviteCode = String(formData.get("inviteCode") ?? "").trim();

  if (!inviteCode) {
    return failure("Invalid invite code");
  }

  try {
    await requestCoachLink(inviteCode);
    revalidatePath("/athlete");
    return success();
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Request failed");
  }
}

export async function cancelCoachLinkRequestAction(
  relationshipId: string,
): Promise<LinkActionResult> {
  try {
    await cancelCoachLinkRequest(relationshipId);
    revalidatePath("/athlete");
    return success();
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Cancel failed");
  }
}

export async function acceptCoachLinkAction(
  relationshipId: string,
): Promise<LinkActionResult> {
  try {
    await acceptCoachLink(relationshipId);
    revalidatePath("/coach/athletes");
    revalidatePath("/coach/athletes/pending");
    revalidatePath("/athlete");
    return success();
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Accept failed");
  }
}

export async function rejectCoachLinkAction(
  relationshipId: string,
): Promise<LinkActionResult> {
  try {
    await rejectCoachLink(relationshipId);
    revalidatePath("/coach/athletes");
    revalidatePath("/coach/athletes/pending");
    revalidatePath("/athlete");
    return success();
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Reject failed");
  }
}

export async function unlinkCoachAthleteAction(
  relationshipId: string,
): Promise<LinkActionResult> {
  try {
    await unlinkCoachAthlete(relationshipId);
    revalidatePath("/coach/athletes");
    revalidatePath("/coach/athletes/pending");
    revalidatePath("/athlete");
    revalidatePath("/athlete/settings");
    return success();
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Unlink failed");
  }
}
