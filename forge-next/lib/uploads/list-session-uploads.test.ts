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

import { listSessionUploads } from "@/lib/uploads/list-session-uploads";

describe("listSessionUploads", () => {
  beforeEach(() => {
    mockList.mockReset();
  });

  it("returns object paths under the session prefix", async () => {
    mockList.mockResolvedValue({
      data: [
        { name: "workbook__summary.txt", metadata: { size: 10 } },
        { name: "workbook__volume.txt", metadata: { size: 20 } },
      ],
      error: null,
    });

    const items = await listSessionUploads("coach-1", "session-1");

    expect(mockList).toHaveBeenCalledWith("coach-1/session-1", {
      limit: 100,
      sortBy: { column: "name", order: "asc" },
    });
    expect(items).toEqual([
      {
        path: "coach-1/session-1/workbook__summary.txt",
        name: "workbook__summary.txt",
        sizeBytes: 10,
      },
      {
        path: "coach-1/session-1/workbook__volume.txt",
        name: "workbook__volume.txt",
        sizeBytes: 20,
      },
    ]);
  });

  it("returns an empty list when storage list fails", async () => {
    mockList.mockResolvedValue({ data: null, error: { message: "fail" } });
    expect(await listSessionUploads("coach-1", "session-1")).toEqual([]);
  });
});
