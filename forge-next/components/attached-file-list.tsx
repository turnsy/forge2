import { PaperclipIcon } from "@/components/icons/paperclip-icon";

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
        <span
          key={file.id}
          className="inline-flex items-center gap-2 rounded-full border border-glass-border bg-glass px-3 py-1.5 text-sm text-surface-foreground shadow-[inset_0_1px_0_0_var(--color-glass-highlight)]"
        >
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
