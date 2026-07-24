import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DialogActionsProps {
  onCancel: () => void;
  saving?: boolean;
  cancelLabel?: string;
  confirmLabel?: string;
  savingLabel?: string;
}

export function DialogActions({
  onCancel,
  saving = false,
  cancelLabel = "Cancel",
  confirmLabel = "Confirm",
  savingLabel = "Saving...",
}: DialogActionsProps) {
  return (
    <div className="flex gap-3 justify-end px-4 py-3 border-t bg-popover shrink-0">
      <Button
        variant="outline"
        onClick={onCancel}
        type="button"
        size="default"
        disabled={saving}
        className="h-10 min-w-[100px]"
      >
        {cancelLabel}
      </Button>
      <Button
        type="submit"
        size="default"
        disabled={saving}
        className="h-10 min-w-[140px]"
      >
        {saving && <Loader2 className="size-4 animate-spin mr-1.5" />}
        {saving ? savingLabel : confirmLabel}
      </Button>
    </div>
  );
}
