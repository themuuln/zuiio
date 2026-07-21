"use client";

import { useState, useEffect } from "react";
import { Toaster as SonnerToaster } from "sonner";

type ToasterProps = React.ComponentProps<typeof SonnerToaster>;

function Toaster({ ...props }: ToasterProps) {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("light");

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const htmlHasDark = document.documentElement.classList.contains("dark");

    if (htmlHasDark) {
      setTheme("dark");
    } else {
      setTheme(mq.matches ? "dark" : "light");
    }

    const handler = () => {
      const htmlHasDark = document.documentElement.classList.contains("dark");
      setTheme(htmlHasDark ? "dark" : mq.matches ? "dark" : "light");
    };

    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <SonnerToaster
      theme={theme}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
