import { useCallback } from "react";
import type { DrawerRootChangeEventDetails } from "@/components/ui/drawer";

/**
 * Returns an `onOpenChange` handler that prevents the drawer from closing
 * when `hasUnsavedChanges` is true, and instead triggers `onConfirmRequest`
 * so you can show a confirmation dialog.
 *
 * @example
 * ```tsx
 * const handleClose = useDrawerCloseConfirm(
 *   formState.isDirty,
 *   () => setConfirmOpen(true),
 *   setDrawerOpen,
 * );
 *
 * <DrawerLayout open={open} onOpenChange={handleClose} />
 *
 * <AlertDialog.Root open={confirmOpen} onOpenChange={setConfirmOpen}>
 * </AlertDialog.Root>
 * ```
 */
export function useDrawerCloseConfirm(
  hasUnsavedChanges: boolean,
  onConfirmRequest: () => void,
  onClose: (open: boolean) => void,
) {
  return useCallback(
    (open: boolean, eventDetails?: DrawerRootChangeEventDetails) => {
      if (!open && hasUnsavedChanges && eventDetails) {
        eventDetails.cancel();
        onConfirmRequest();
        return;
      }
      onClose(open);
    },
    [hasUnsavedChanges, onConfirmRequest, onClose],
  );
}
