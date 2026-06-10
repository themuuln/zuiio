"use client";

import { useCallback, useState } from "react";
import type { ToastState } from "./_types";

export function useBayViewToast() {
  const [toast, setToast] = useState<ToastState | null>(null);
  const dismiss = useCallback(() => setToast(null), []);

  return { toast, setToast, dismiss } as const;
}
