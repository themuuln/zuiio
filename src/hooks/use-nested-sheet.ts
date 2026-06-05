"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { zStack } from "@/lib/z-stack";

/**
 * Manage a child overlay that stacks on top of a parent overlay.
 *
 * Handles z-index layering, auto-close when parent closes, and cleanup.
 *
 * @param parentOpen - Whether the parent overlay is currently open
 * @returns { childOpen, openChild, closeChild, zLayer }
 *
 * @example
 * ```tsx
 * function MyDetailSheet({ open, onOpenChange }) {
 *   const { childOpen, openChild, closeChild, zLayer } = useNestedSheet(open);
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
 *           <SheetContent side="right" zLayer={zLayer}>
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
  const [zLayer, setZLayer] = useState(0);
  const wasOpenRef = useRef(false);

  // Push/pop z-layer when child opens/closes
  useEffect(() => {
    if (childOpen && !wasOpenRef.current) {
      wasOpenRef.current = true;
      setZLayer(zStack.push());
    } else if (!childOpen && wasOpenRef.current) {
      wasOpenRef.current = false;
      zStack.pop();
    }

    return () => {
      if (wasOpenRef.current) {
        wasOpenRef.current = false;
        zStack.pop();
      }
    };
  }, [childOpen]);

  // When parent closes, also close child
  useEffect(() => {
    if (!parentOpen && childOpen) {
      setChildOpen(false);
    }
  }, [parentOpen, childOpen]);

  const openChild = useCallback(() => setChildOpen(true), []);
  const closeChild = useCallback(() => setChildOpen(false), []);

  return { childOpen, openChild, closeChild, zLayer };
}
