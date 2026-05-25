"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ThemeToggle({
  collapsed,
}: {
  collapsed?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg",
          collapsed && "lg:mx-auto",
        )}
      >
        <div className="size-4" />
      </div>
    );
  }

  const isDark = theme === "dark";

  return (
    <Button
      variant="ghost"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "w-full justify-start gap-3 px-3 py-2 text-sm font-medium",
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        "focus-visible:ring-sidebar-ring",
        collapsed && "lg:justify-center lg:px-0",
      )}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <Sun className="size-5 shrink-0" aria-hidden="true" />
      ) : (
        <Moon className="size-5 shrink-0" aria-hidden="true" />
      )}
      {!collapsed && <span>{isDark ? "Light" : "Dark"}</span>}
    </Button>
  );
}
