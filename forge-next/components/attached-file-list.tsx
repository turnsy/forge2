import { PaperclipIcon } from "@/components/icons/paperclip-icon";
import { attachmentChipClass } from "@/lib/theme";

type AttachedFile = {
  id: string;
  name: string;
};

export function AttachedFileList({
  files,
  onRemove,
}: {
  files: AttachedFile[];
  onRemove: (id: string) => void;
}) {
  if (files.length === 0) {
    return null;
  }

  return (
    <div className="absolute inset-x-0 top-full z-10 mt-2 flex flex-wrap justify-start gap-2">
      {files.map((file) => (
        <span key={file.id} className={`${attachmentChipClass()} gap-2`}>
          <PaperclipIcon className="h-3.5 w-3.5 shrink-0 text-surface-muted" />
          <span className="max-w-[14rem] truncate">{file.name}</span>
          <button
            type="button"
            className="text-surface-muted transition hover:text-surface-foreground"
            aria-label={`Remove ${file.name}`}
            onClick={() => onRemove(file.id)}
          >
            ×
          </button>
        </span>
      ))}
    </div>
  );
}
