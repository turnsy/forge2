import { describe, expect, it } from "vitest";
import { groupSessionUploadsIntoAttachments } from "@/lib/uploads/session-upload-attachments";
import type { SessionUploadListItem } from "@/lib/uploads/list-session-uploads";

describe("groupSessionUploadsIntoAttachments", () => {
  it("groups multi-sheet workbook objects into one chip", () => {
    const items: SessionUploadListItem[] = [
      {
        path: "coach/session/workbook__volume.txt",
        name: "workbook__volume.txt",
        sizeBytes: 10,
      },
      {
        path: "coach/session/workbook__summary.txt",
        name: "workbook__summary.txt",
        sizeBytes: 20,
      },
    ];

    const attachments = groupSessionUploadsIntoAttachments(items);

    expect(attachments).toHaveLength(1);
    expect(attachments[0]).toMatchObject({
      status: "uploaded",
      displayLabel: "workbook.xlsx (2 sheets)",
      contextFileIds: [
        "coach/session/workbook__summary.txt",
        "coach/session/workbook__volume.txt",
      ],
    });
    expect(attachments[0]?.file).toBeUndefined();
  });

  it("maps single-object uploads to one chip each", () => {
    const attachments = groupSessionUploadsIntoAttachments([
      {
        path: "coach/session/my-plan.txt",
        name: "my-plan.txt",
        sizeBytes: 5,
      },
      {
        path: "coach/session/notes.txt",
        name: "notes.txt",
        sizeBytes: 8,
      },
    ]);

    expect(attachments).toHaveLength(2);
    expect(attachments.map((attachment) => attachment.displayLabel)).toEqual([
      "my plan",
      "notes",
    ]);
    expect(attachments[0]?.contextFileIds).toEqual([
      "coach/session/my-plan.txt",
    ]);
    expect(attachments[1]?.contextFileIds).toEqual(["coach/session/notes.txt"]);
  });

  it("returns an empty list when there are no uploads", () => {
    expect(groupSessionUploadsIntoAttachments([])).toEqual([]);
  });
});
