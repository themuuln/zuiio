/**
 * Section header — reusable label + title + optional description + action.
 *
 * DRY pattern for the 6+ identical section header blocks in the game
 * detail page. Title uses Geist Sans 600 (font-bold tracking-tight)
 * and label uses uppercase Geist 500 (text-xs tracking-wider).
 *
 * Server-safe — no client hooks.
 */

import type { ReactNode } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SectionHeaderProps {
  /** Muted uppercase label above the title (e.g. "Тоон зураг", "Үеийн дүн") */
  label: string;
  /** Section heading (e.g. "Багийн харьцуулалт", "Үеүүд") */
  title: string;
  /** Optional descriptive text below the title */
  description?: string;
  /** Optional action element (badge, button) placed in the top-right */
  action?: ReactNode;
  /** Optional id for aria-labelledby references */
  id?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SectionHeader({
  label,
  title,
  description,
  action,
  id,
}: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <h2 id={id} className="text-2xl font-bold tracking-tight">
            {title}
          </h2>
          {action}
        </div>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
    </div>
  );
}
