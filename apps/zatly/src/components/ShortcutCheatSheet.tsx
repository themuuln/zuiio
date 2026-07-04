"use client";

import { useEffect, useState } from "react";

const SHORTCUTS = [
  { category: "Flow Editing", items: [
    { keys: "⌘Z / Ctrl+Z", desc: "Undo" },
    { keys: "⌘⇧Z / Ctrl+⇧Z", desc: "Redo" },
    { keys: "⌘Y / Ctrl+Y", desc: "Redo (alternative)" },
    { keys: "Backspace / Delete", desc: "Delete selected node or edge" },
    { keys: "⇧ + Click", desc: "Multi-select nodes" },
    { keys: "⌘A / Ctrl+A", desc: "Select all nodes" },
  ]},
  { category: "Canvas Navigation", items: [
    { keys: "Scroll wheel", desc: "Pan canvas" },
    { keys: "⌘ + Scroll / Pinch", desc: "Zoom in/out" },
    { keys: "Drag on empty space", desc: "Rubber band select" },
  ]},
  { category: "Nodes", items: [
    { keys: "Double-click text", desc: "Inline edit message/question text" },
    { keys: "Drag from quick-add", desc: "Drag node onto canvas" },
    { keys: "Drag from handle", desc: "Create connection" },
    { keys: "? / /", desc: "Toggle this cheat sheet" },
  ]},
];

export function ShortcutCheatSheet() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "?" || e.key === "/") {
        if (!(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
          e.preventDefault();
          setIsOpen((prev) => !prev);
        }
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="w-[480px] max-h-[80vh] overflow-y-auto rounded-2xl border border-border bg-surface shadow-2xl p-6 animate-[fadeScaleIn_0.12s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="m-0 text-lg font-semibold text-text">Keyboard Shortcuts</h2>
          <button
            type="button"
            className="h-7 w-7 rounded-lg border border-border text-text-muted text-sm cursor-pointer hover:bg-surface-2 transition-colors flex items-center justify-center"
            onClick={() => setIsOpen(false)}
          >
            ✕
          </button>
        </div>

        {SHORTCUTS.map((section) => (
          <div key={section.category} className="mb-4">
            <h3 className="m-0 mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
              {section.category}
            </h3>
            <div className="space-y-1">
              {section.items.map((item) => (
                <div key={item.keys} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-surface-2 transition-colors">
                  <span className="text-sm text-text">{item.desc}</span>
                  <kbd className="ml-3 px-2 py-0.5 rounded-md border border-border bg-bg text-xs text-text-muted font-mono whitespace-nowrap">
                    {item.keys}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        ))}

        <p className="mt-4 text-xs text-text-muted text-center border-t border-border pt-3">
          Press <kbd className="px-1.5 py-0.5 rounded border border-border bg-bg text-xs font-mono">?</kbd> or <kbd className="px-1.5 py-0.5 rounded border border-border bg-bg text-xs font-mono">/</kbd> to toggle
        </p>
      </div>
    </div>
  );
}
