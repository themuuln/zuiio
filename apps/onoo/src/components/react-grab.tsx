"use client";

// Dev-only: react-grab lets you copy UI element context for AI agents
// by hovering any element and pressing ⌘C/Ctrl+C
// https://react-grab.com

import { useEffect } from "react";

export function ReactGrab() {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      import("react-grab");
    }
  }, []);

  return null;
}
