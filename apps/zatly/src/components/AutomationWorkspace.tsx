"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Automation } from "@/types/automation";

const MORE_ACTIONS: Array<{ id: string; label: string; danger?: boolean }> = [
  { id: "rename", label: "Rename" },
  { id: "duplicate", label: "Duplicate" },
  { id: "convert", label: "Convert channels" },
  { id: "move", label: "Move to" },
  { id: "share", label: "Share" },
  { id: "duplicate-page", label: "Duplicate to another page" },
  { id: "delete", label: "Delete", danger: true },
];

function formatModified(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  if (!Number.isFinite(diffMs) || diffMs < 0) return "just now";
  const minutes = Math.floor(diffMs / (1000 * 60));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? "" : "s"} ago`;
}

export function AutomationWorkspace({
  onOpenAutomation,
}: {
  onOpenAutomation: (automation: { id: string; name: string }) => void;
}) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [trigger, setTrigger] = useState("any");
  const [triggerState, setTriggerState] = useState("any");
  const [automations, setAutomations] = useState<Automation[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);

  const loadAutomations = useCallback(async () => {
    setLoading(true);
    setError(null);

    const url = new URL("/api/automations", window.location.origin);
    if (query.trim()) url.searchParams.set("query", query.trim());
    if (trigger !== "any") url.searchParams.set("trigger", trigger);
    if (triggerState !== "any") url.searchParams.set("triggerState", triggerState);

    try {
      const response = await fetch(url.toString(), { cache: "no-store" });
      const data = (await response.json()) as { automations?: Automation[]; error?: string };
      if (!response.ok) {
        setError(data.error ?? "Failed to load automations.");
        return;
      }
      setAutomations(data.automations ?? []);
    } catch {
      setError("Failed to load automations.");
    } finally {
      setLoading(false);
    }
  }, [query, trigger, triggerState]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target)) {
        setOpenMenuId(null);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenMenuId(null);
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => {
    const id = setTimeout(() => {
      void loadAutomations();
    }, 180);
    return () => clearTimeout(id);
  }, [loadAutomations]);

  const folders = useMemo(() => {
    return Array.from(new Set(automations.map((a) => a.folder))).slice(0, 2);
  }, [automations]);

  async function onCreateAutomation() {
    const name = window.prompt("Automation name");
    if (!name || !name.trim()) return;
    setMutating("create");
    try {
      const response = await fetch("/api/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), folder: "General" }),
      });
      const data = (await response.json()) as { error?: string; automation?: Automation };
      if (!response.ok) {
        setError(data.error ?? "Failed to create automation.");
        return;
      }
      if (data.automation) {
        setAutomations((prev) => [data.automation as Automation, ...prev]);
      }
    } catch {
      setError("Failed to create automation.");
    } finally {
      setMutating(null);
    }
  }

  async function onAction(automation: Automation, actionId: string) {
    setOpenMenuId(null);
    if (actionId === "rename") {
      const nextName = window.prompt("Rename automation", automation.name);
      if (!nextName || !nextName.trim()) return;
      setMutating(automation.id);
      try {
        const response = await fetch(`/api/automations/${automation.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: nextName.trim() }),
        });
        const data = (await response.json()) as { error?: string; automation?: Automation };
        if (!response.ok || !data.automation) {
          setError(data.error ?? "Failed to rename automation.");
          return;
        }
        setAutomations((prev) => prev.map((a) => (a.id === automation.id ? data.automation! : a)));
      } catch {
        setError("Failed to rename automation.");
      } finally {
        setMutating(null);
      }
      return;
    }

    if (actionId === "duplicate") {
      setMutating(automation.id);
      try {
        const response = await fetch(`/api/automations/${automation.id}/duplicate`, {
          method: "POST",
        });
        const data = (await response.json()) as { error?: string; automation?: Automation };
        if (!response.ok || !data.automation) {
          setError(data.error ?? "Failed to duplicate automation.");
          return;
        }
        setAutomations((prev) => [data.automation!, ...prev]);
      } catch {
        setError("Failed to duplicate automation.");
      } finally {
        setMutating(null);
      }
      return;
    }

    if (actionId === "delete") {
      const yes = window.confirm(`Delete "${automation.name}"?`);
      if (!yes) return;
      setMutating(automation.id);
      try {
        const response = await fetch(`/api/automations/${automation.id}`, {
          method: "DELETE",
        });
        const data = (await response.json()) as { error?: string };
        if (!response.ok) {
          setError(data.error ?? "Failed to delete automation.");
          return;
        }
        setAutomations((prev) => prev.filter((a) => a.id !== automation.id));
      } catch {
        setError("Failed to delete automation.");
      } finally {
        setMutating(null);
      }
      return;
    }

    setError(`"${actionId}" is queued for implementation.`);
  }

  return (
    <section className="flex-1 min-w-0 min-h-0 bg-bg overflow-auto">
      <div ref={rootRef} className="mx-auto w-full max-w-[1180px] p-5 md:p-6">
        <div className="grid grid-cols-[190px_1fr] gap-5">
          <aside className="rounded-xl border border-border bg-surface p-2 h-fit">
            <button className="w-full text-left rounded-lg px-2.5 py-2 text-sm font-semibold border border-border bg-surface-2 text-text">
              My Automations
            </button>
            <div className="mt-1 px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] text-text-muted">Basic</div>
            <button className="w-full text-left rounded-md px-2.5 py-1.5 text-sm text-text-muted hover:text-text hover:bg-surface-2">
              Keywords
            </button>
            <button className="w-full text-left rounded-md px-2.5 py-1.5 text-sm text-text-muted hover:text-text hover:bg-surface-2">
              Sequences
            </button>
            <button className="w-full text-left rounded-md px-2.5 py-1.5 text-sm text-text-muted hover:text-text hover:bg-surface-2">
              Rules
            </button>
          </aside>

          <div>
            <div className="flex items-center justify-between gap-4">
              <h2 className="m-0 text-3xl font-semibold text-text">My Automations</h2>
              <button
                className="h-10 px-4 rounded-lg border border-accent/60 bg-accent/15 text-text text-sm font-semibold cursor-pointer hover:bg-accent/25 disabled:opacity-60"
                onClick={() => void onCreateAutomation()}
                disabled={mutating === "create"}
              >
                + New Automation
              </button>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <input
                className="h-10 px-3 rounded-lg border border-border bg-surface text-sm text-text outline-none focus:border-accent font-sans"
                placeholder="Search all Automations"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <select
                className="h-10 px-3 rounded-lg border border-border bg-surface text-sm text-text outline-none focus:border-accent font-sans"
                value={trigger}
                onChange={(e) => setTrigger(e.target.value)}
              >
                <option value="any">Any Trigger</option>
                <option value="keyword">Keyword</option>
                <option value="default">Default</option>
                <option value="button">Button</option>
                <option value="ref">Ref</option>
              </select>
              <select
                className="h-10 px-3 rounded-lg border border-border bg-surface text-sm text-text outline-none focus:border-accent font-sans"
                value={triggerState}
                onChange={(e) => setTriggerState(e.target.value)}
              >
                <option value="any">Any Trigger states</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-3">
              {folders.map((folder) => (
                <div
                  key={folder}
                  className="h-11 rounded-lg border border-border bg-surface-2 px-3 flex items-center text-sm text-text"
                >
                  📁 {folder}
                </div>
              ))}
              <button className="h-11 rounded-lg border border-dashed border-accent/70 text-accent bg-transparent text-sm font-semibold cursor-pointer">
                + New Folder
              </button>
            </div>

            {error ? <p className="mt-3 mb-0 text-xs text-red">{error}</p> : null}
            {loading ? <p className="mt-3 mb-0 text-xs text-text-muted">Loading automations...</p> : null}

            <div className="mt-5 flex flex-col gap-3">
              {automations.map((automation) => (
                <div
                  key={automation.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onOpenAutomation({ id: automation.id, name: automation.name })}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onOpenAutomation({ id: automation.id, name: automation.name });
                    }
                  }}
                  className="text-left rounded-xl border border-border bg-surface p-4 cursor-pointer hover:border-border-hover hover:bg-surface-2 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide ${
                          automation.status === "live"
                            ? "bg-red/20 text-red border border-red/50"
                            : "bg-surface-2 text-text-muted border border-border"
                        }`}
                      >
                        {automation.status}
                      </span>
                      <span className="text-lg font-semibold text-text truncate">
                        {automation.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-6 text-xs text-text-muted shrink-0">
                      <span>Runs: {automation.runs}</span>
                      <span>CTR: {automation.ctr}%</span>
                      <span>{formatModified(automation.modifiedAt)}</span>
                      <div className="relative">
                        <button
                          type="button"
                          className="h-8 w-8 rounded-md border border-border bg-bg text-text-muted text-lg leading-none cursor-pointer hover:border-border-hover hover:text-text"
                          onClick={(event) => {
                            event.stopPropagation();
                            setOpenMenuId((current) =>
                              current === automation.id ? null : automation.id
                            );
                          }}
                          title="More options"
                          disabled={mutating === automation.id}
                        >
                          ⋮
                        </button>

                        {openMenuId === automation.id ? (
                          <div
                            className="absolute right-0 top-9 z-30 w-[250px] rounded-xl border border-border bg-surface shadow-2xl py-1"
                            onClick={(event) => event.stopPropagation()}
                          >
                            {MORE_ACTIONS.map((action, index) => (
                              <button
                                key={action.id}
                                type="button"
                                className={`w-full text-left px-3 py-2.5 text-sm border-none bg-transparent cursor-pointer hover:bg-surface-2 ${
                                  action.danger ? "text-red" : "text-text"
                                } ${
                                  index === MORE_ACTIONS.length - 1
                                    ? "border-t border-border"
                                    : ""
                                }`}
                                onClick={() => void onAction(automation, action.id)}
                              >
                                {action.label}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-1 flex-wrap">
                    <span className="text-[12px] text-text-muted">
                      {automation.trigger === "keyword" ? "Message contains" : "Trigger"}
                    </span>
                    {automation.keywords.map((keyword) => (
                      <span
                        key={`${automation.id}-${keyword}`}
                        className="px-2 py-0.5 rounded-full border border-border bg-bg text-[11px] text-text"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
