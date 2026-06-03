import { beforeEach, describe, expect, it, vi } from "vitest";

const mockList = vi.fn();

vi.mock("@/utils/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    storage: {
      from: () => ({
        list: mockList,
      }),
    },
  })),
}));

import { listDraftUploads } from "@/lib/uploads/list-draft-uploads";

describe("listDraftUploads", () => {
  beforeEach(() => {
    mockList.mockReset();
  });

  it("lists objects under the coach and draft prefix", async () => {
    mockList.mockResolvedValue({
      data: [
        { name: "plan__summary.txt", metadata: { size: 100 } },
        { name: "plan__volume.txt", metadata: { size: 200 } },
      ],
      error: null,
    });

    const items = await listDraftUploads("coach-1", "draft-1");

    expect(mockList).toHaveBeenCalledWith("coach-1/draft-1", {
      limit: 100,
      sortBy: { column: "name", order: "asc" },
    });
    expect(items).toEqual([
      {
        path: "coach-1/draft-1/plan__summary.txt",
        name: "plan__summary.txt",
        sizeBytes: 100,
      },
      {
        path: "coach-1/draft-1/plan__volume.txt",
        name: "plan__volume.txt",
        sizeBytes: 200,
      },
    ]);
  });

  it("returns an empty array when listing fails", async () => {
    mockList.mockResolvedValue({ data: null, error: { message: "fail" } });
    expect(await listDraftUploads("coach-1", "draft-1")).toEqual([]);
  });
});
