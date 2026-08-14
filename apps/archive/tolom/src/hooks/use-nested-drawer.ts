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
 * function MyDetailDrawer({ open, onOpenChange }) {
 *   const { childOpen, openChild, closeChild } = useNestedDrawer(open);
 *
 *   return (
 *     <DetailDrawer open={open} onOpenChange={onOpenChange}>
 *       <DetailDrawer.Body>
 *         <Button onClick={openChild}>Open Sub Form</Button>
 *
 *         <DetailDrawer
 *           open={childOpen}
 *           onOpenChange={(v) => (v ? openChild() : closeChild())}
 *         >
 *           <DetailDrawer.Body>
 *             <SubForm onSuccess={closeChild} />
 *           </DetailDrawer.Body>
 *         </DetailDrawer>
 *       </DetailDrawer.Body>
 *     </DetailDrawer>
 *   );
 * }
 * ```
 */
export function useNestedDrawer(parentOpen: boolean) {
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
