"use client";

import type { ReactNode } from "react";
import {
  DrawerProvider as BaseDrawerProvider,
  DrawerIndent,
  DrawerIndentBackground,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

/**
 * Wraps the app in Drawer.Provider + IndentBackground + Indent
 * so every drawer gets the indent (scale-down) effect when open.
 */
export function DrawerProvider({ children }: { children: ReactNode }) {
  return (
    <BaseDrawerProvider>
      <DrawerIndentBackground
        className={(state) =>
          cn(
            "fixed inset-0 z-0 bg-black transition-opacity duration-300 pointer-events-none",
            state.active ? "opacity-30" : "opacity-0",
          )
        }
      />
      <DrawerIndent
        className={(state) =>
          cn(
            "relative z-1 flex min-h-dvh flex-col antialiased transition-all duration-300 origin-center overflow-hidden",
            state.active && "rounded-2xl scale-[0.96] overflow-hidden",
          )
        }
      >
        {children}
      </DrawerIndent>
    </BaseDrawerProvider>
  );
}
