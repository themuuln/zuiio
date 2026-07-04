"use client";

import type { ReactNode } from "react";

interface NoteColors {
  bg: string;
  border: string;
  text: string;
}

export interface NodeWrapperProps {
  /** Body content rendered inside the wrapper */
  children?: ReactNode;
  /** Whether the node is currently selected */
  selected: boolean;
  /** Header background color (hex) */
  color: string;
  /** Header icon (emoji string) */
  icon: string;
  /** Header label text */
  label: string;
  /** Enable sticky-note visual mode (for NoteNode) */
  isNote?: boolean;
  /** Colors for sticky-note mode */
  noteColors?: NoteColors;
  /** Extra content to render at the right end of the header (e.g. card count badge) */
  headerRight?: ReactNode;
  /** Optional footer rendered below the body (e.g. condition yes/no, A/B test variants) */
  footer?: ReactNode;
  /** Additional class names for the outer container */
  className?: string;
}

/**
 * NodeWrapper provides the consistent visual structure for all canvas node types:
 * - Outer container with border, shadow, rounded corners, and selection ring
 * - Colored header bar with icon + label
 * - Body content slot via children
 * - Optional footer slot for multi-output nodes
 * - Optional sticky-note mode for NoteNode
 *
 * The wrapper respects dark mode via CSS custom properties.
 */
export function NodeWrapper({
  children,
  selected,
  color,
  icon,
  label,
  isNote,
  noteColors,
  headerRight,
  footer,
  className = "",
}: NodeWrapperProps) {
  // Sticky-note mode (NoteNode)
  if (isNote && noteColors) {
    return (
      <div
        className={`min-w-[160px] max-w-[260px] rounded-xl overflow-hidden transition-all text-[13px] ${className} ${
          selected ? "ring-2 ring-white/30" : ""
        }`}
        style={{
          background: noteColors.bg,
          borderColor: noteColors.border,
          borderWidth: 1,
        }}
      >
        <div
          className="flex items-center justify-between px-2.5 py-1 text-xs font-semibold"
          style={{
            color: noteColors.text,
            borderBottom: `1px solid ${noteColors.border}`,
          }}
        >
          <span>
            {icon} {label}
          </span>
        </div>
        <div className="p-2.5 px-3">{children}</div>
      </div>
    );
  }

  // Standard node mode
  return (
    <div
      className={`min-w-[180px] max-w-[240px] bg-surface border rounded-xl overflow-hidden text-[13px] transition-all ${className} ${
        selected
          ? "border-accent shadow-[0_0_0_2px_rgba(99,102,241,0.25)]"
          : "border-border"
      }`}
    >
      <div
        className="flex items-center gap-1.5 p-1.5 px-2.5 text-white font-semibold text-[12px]"
        style={{ background: color }}
      >
        <span className="text-sm">{icon}</span>
        <span className="whitespace-nowrap overflow-hidden text-ellipsis">
          {label}
        </span>
        {headerRight && <span className="ml-auto">{headerRight}</span>}
      </div>
      <div className="p-2 px-2.5">{children}</div>
      {footer && (
        <div className="border-t border-border">{footer}</div>
      )}
    </div>
  );
}
