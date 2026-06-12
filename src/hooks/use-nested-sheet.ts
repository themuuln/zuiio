"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * @deprecated Z-index layering is now handled automatically by the Base UI
 * nested dialog system. This hook no longer manages `zLayer` — use it only
 * for parent/child open state coordination.
 *
 * Manage a child overlay that stacks on top of a parent overlay.
 * Handles auto-close when parent closes and child open/close state.
 *
 * @param parentOpen - Whether the parent overlay is currently open
 * @returns { childOpen, openChild, closeChild }
 *
 * @example
 * ```tsx
 * function MyDetailSheet({ open, onOpenChange }) {
 *   const { childOpen, openChild, closeChild } = useNestedSheet(open);
 *
 *   return (
 *     <DetailSheet open={open} onOpenChange={onOpenChange}>
 *       <DetailSheet.Body>
 *         <Button onClick={openChild}>Open Sub Form</Button>
 *
 *         <Sheet
 *           open={childOpen}
 *           onOpenChange={(v) => (v ? openChild() : closeChild())}
 *         >
 *           <SheetContent side="right">
 *             <SubForm onSuccess={closeChild} />
 *           </SheetContent>
 *         </Sheet>
 *       </DetailSheet.Body>
 *     </DetailSheet>
 *   );
 * }
 * ```
 */
export function useNestedSheet(parentOpen: boolean) {
  const [childOpen, setChildOpen] = useState(false);

  // When parent closes, also close child
  useEffect(() => {
    if (!parentOpen && childOpen) {
      setChildOpen(false);
    }
  }, [parentOpen, childOpen]);

  const openChild = useCallback(() => setChildOpen(true), []);
  const closeChild = useCallback(() => setChildOpen(false), []);

  return { childOpen, openChild, closeChild };
}
