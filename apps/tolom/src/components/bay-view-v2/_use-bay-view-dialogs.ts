"use client";

import { useCallback, useState } from "react";

type DialogKey = "shiftReport" | "vehicleReg" | "batchComplete" | "assign";

/** All dialog open states as a single map. One state, one setter pattern. */
export function useBayViewDialogs() {
  const [open, setOpen] = useState<Record<DialogKey, boolean>>({
    shiftReport: false,
    vehicleReg: false,
    batchComplete: false,
    assign: false,
  });

  const show = useCallback(
    (key: DialogKey) => setOpen((prev) => ({ ...prev, [key]: true })),
    [],
  );

  const hide = useCallback(
    (key: DialogKey) => setOpen((prev) => ({ ...prev, [key]: false })),
    [],
  );

  const set = useCallback(
    (key: DialogKey, value: boolean) =>
      setOpen((prev) => ({ ...prev, [key]: value })),
    [],
  );

  /** Assign dialog carries a bay number — track it alongside open state. */
  const [assignBay, setAssignBay] = useState<number | null>(null);
  const openAssign = useCallback((bayNumber: number) => {
    setAssignBay(bayNumber);
    setOpen((prev) => ({ ...prev, assign: true }));
  }, []);
  const closeAssign = useCallback(() => {
    setAssignBay(null);
    setOpen((prev) => ({ ...prev, assign: false }));
  }, []);

  return {
    open,
    show,
    hide,
    set,
    assignBay,
    openAssign,
    closeAssign,
  } as const;
}

export type { DialogKey };

export interface BayViewDialogsState {
  open: Record<DialogKey, boolean>;
  show: (key: DialogKey) => void;
  hide: (key: DialogKey) => void;
  set: (key: DialogKey, value: boolean) => void;
  assignBay: number | null;
  openAssign: (bayNumber: number) => void;
  closeAssign: () => void;
}
