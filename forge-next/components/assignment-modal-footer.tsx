import { Button } from "@/components/ui";

export function AssignmentModalFooter({
  pending,
  loading,
  onCancel,
  onConfirm,
  confirmLabel,
  pendingLabel,
}: {
  pending: boolean;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel: string;
  pendingLabel: string;
}) {
  return (
    <div className="flex justify-end gap-3">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        fullWidth={false}
        disabled={pending}
        onClick={onCancel}
      >
        Cancel
      </Button>
      <Button
        type="button"
        size="sm"
        fullWidth={false}
        disabled={pending || loading}
        onClick={onConfirm}
      >
        {pending ? pendingLabel : confirmLabel}
      </Button>
    </div>
  );
}
