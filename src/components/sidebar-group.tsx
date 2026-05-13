"use client";

import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState, useEffect } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link, usePathname } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";
import type { NavGroup } from "@/hooks/use-navigation";

interface SidebarGroupProps {
  group: NavGroup;
  collapsed: boolean;
}

export default function SidebarGroup({
  group,
  collapsed,
}: SidebarGroupProps) {
  const t = useTranslations();
  const pathname = usePathname();
  const [open, setOpen] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  // Auto-open if any child is active
  const hasActive = group.children.some((item) => {
    if (item.href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(item.href);
  });

  useEffect(() => {
    if (hasActive) setOpen(true);
  }, [hasActive]);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(open ? contentRef.current.scrollHeight : 0);
    }
  }, [open, group.children]);

  const Icon = group.icon;

  // When collapsed in sidebar, show group label as tooltip
  if (collapsed) {
    return (
      <div>
        <div className="flex items-center justify-center px-2 py-2">
          <Tooltip>
            <TooltipTrigger
              render={
                <span className="flex size-9 items-center justify-center rounded-lg text-sidebar-foreground/50 cursor-default">
                  <Icon className="size-5 shrink-0" aria-hidden="true" />
                </span>
              }
            />
            <TooltipContent side="right">
              {t(group.labelKey)}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
          hasActive
            ? "bg-sidebar-accent/50 text-sidebar-accent-foreground"
            : "text-sidebar-foreground/50",
        )}
        aria-expanded={open}
      >
        <Icon className="size-4 shrink-0" aria-hidden="true" />
        <span className="flex-1 text-left text-xs font-semibold uppercase tracking-wider">
          {t(group.labelKey)}
        </span>
        <ChevronDown
          className={cn(
            "size-3.5 shrink-0 transition-transform duration-200",
            open && "rotate-0",
            !open && "-rotate-90",
          )}
          aria-hidden="true"
        />
      </button>

      <div
        ref={contentRef}
        className="overflow-hidden transition-[height] duration-200 ease-in-out"
        style={{ height: open ? height : 0 }}
      >
        <ul className="flex flex-col gap-0.5 pb-1 pl-3 pt-0.5">
          {group.children.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const ChildIcon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <ChildIcon className="size-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{t(item.labelKey)}</span>
                  {active && (
                    <span className="ml-auto block size-1.5 rounded-full bg-sidebar-primary" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
