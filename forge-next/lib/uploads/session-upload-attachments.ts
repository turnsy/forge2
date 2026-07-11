import { formatAttachmentDisplayLabel } from "@/lib/chat/utils";
import type { ChatAttachment } from "@/lib/chat/types";
import type { SessionUploadListItem } from "@/lib/uploads/list-session-uploads";

function objectStem(name: string): string {
  return name.endsWith(".txt") ? name.slice(0, -4) : name;
}

function groupKeyFromStem(stem: string): string {
  const separator = stem.indexOf("__");
  return separator >= 0 ? stem.slice(0, separator) : stem;
}

function humanizeStorageStem(stem: string): string {
  return stem.replace(/-/g, " ");
}

/**
 * Groups normalized storage objects back into composer attachment chips.
 * Multi-sheet XLSX uploads share a workbook stem prefix (`workbook__sheet`).
 */
export function groupSessionUploadsIntoAttachments(
  items: SessionUploadListItem[],
): ChatAttachment[] {
  const groups = new Map<string, SessionUploadListItem[]>();

  for (const item of items) {
    const stem = objectStem(item.name);
    const key = groupKeyFromStem(stem);
    const group = groups.get(key);
    if (group) {
      group.push(item);
    } else {
      groups.set(key, [item]);
    }
  }

  return [...groups.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, groupItems]) => {
      const sortedItems = [...groupItems].sort((left, right) =>
        left.name.localeCompare(right.name),
      );
      const contextFileIds = sortedItems.map((item) => item.path);
      const isWorkbook = sortedItems.some((item) =>
        objectStem(item.name).includes("__"),
      );

      const displayLabel = isWorkbook
        ? formatAttachmentDisplayLabel(
            `${humanizeStorageStem(key)}.xlsx`,
            contextFileIds.length,
          )
        : humanizeStorageStem(key);

      return {
        localId: crypto.randomUUID(),
        status: "uploaded" as const,
        displayLabel,
        contextFileIds,
      };
    });
}
