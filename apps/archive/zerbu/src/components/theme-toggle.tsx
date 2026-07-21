"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useEffect, useState } from "react";

type ThemeToggleProps = {
  className?: string;
};

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className={cn("w-9 h-9", className)} />;

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className={cn(
        "p-2 rounded-full transition-colors cursor-pointer",
        "hover:bg-secondary/20 text-text-secondary hover:text-text",
        "dark:text-dark-text dark:hover:bg-dark-surface",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        className,
      )}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}
