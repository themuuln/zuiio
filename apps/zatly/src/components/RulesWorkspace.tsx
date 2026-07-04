"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface Condition {
  field: string;
  operator: string;
  value: string;
}

interface Action {
  type: string;
  params: Record<string, string>;
}

interface Rule {
  id: string;
  name: string;
  event: string;
  conditions: Condition[];
  actions: Action[];
  enabled: boolean;
  automationId: string | null;
  createdAt: string;
  updatedAt: string;
}

type RuleListResponse = { rules: Rule[] };
type RuleSingleResponse = { rule: Rule };
type RuleErrorResponse = { error: string };

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const EVENT_TYPES = [
  "message_received",
  "tag_added",
  "contact_subscribed",
  "contact_unsubscribed",
  "automation_triggered",
] as const;

const EVENT_LABELS: Record<string, string> = {
  message_received: "Message Received",
  tag_added: "Tag Added",
  contact_subscribed: "Contact Subscribed",
  contact_unsubscribed: "Contact Unsubscribed",
  automation_triggered: "Automation Triggered",
};

const CONDITION_FIELDS = [
  { value: "tag_name", label: "Tag Name" },
  { value: "message_text", label: "Message Text" },
  { value: "contact_name", label: "Contact Name" },
  { value: "automation_name", label: "Automation Name" },
  { value: "channel", label: "Channel" },
];

const CONDITION_OPERATORS = [
  { value: "equals", label: "Equals" },
  { value: "not_equals", label: "Not equals" },
  { value: "contains", label: "Contains" },
  { value: "starts_with", label: "Starts with" },
  { value: "ends_with", label: "Ends with" },
];

const ACTION_TYPE_DEFS: Array<{
  value: string;
  label: string;
  paramDefs: Array<{ key: string; label: string; placeholder: string }>;
}> = [
  { value: "tag", label: "Add Tag", paramDefs: [{ key: "tag", label: "Tag", placeholder: "e.g. vip" }] },
  { value: "subscribe", label: "Subscribe", paramDefs: [] },
  { value: "unsubscribe", label: "Unsubscribe", paramDefs: [] },
  { value: "notify", label: "Send Notification", paramDefs: [{ key: "message", label: "Message", placeholder: "Notification text" }] },
  { value: "send_message", label: "Send Message", paramDefs: [{ key: "message", label: "Message", placeholder: "Message text" }] },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function emptyCondition(): Condition {
  return { field: "tag_name", operator: "equals", value: "" };
}

function emptyAction(): Action {
  return { type: "tag", params: { tag: "" } };
}

function getEventLabel(event: string): string {
  return EVENT_LABELS[event] ?? event;
}

function getActionLabel(type: string): string {
  return ACTION_TYPE_DEFS.find((d) => d.value === type)?.label ?? type;
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                    */
/* ------------------------------------------------------------------ */

function ToggleSwitch({
  enabled,
  onToggle,
  disabled,
}: {
  enabled: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        enabled ? "bg-green-500 border-green-500" : "bg-muted",
      )}
      role="switch"
      aria-checked={enabled}
    >
      <span
        className={cn(
          "pointer-events-none block size-3.5 rounded-full bg-white shadow-xs ring-0 transition-transform",
          enabled ? "translate-x-4" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                    */
/* ------------------------------------------------------------------ */

export function RulesWorkspace() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editor modal state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formEvent, setFormEvent] = useState<string>("message_received");
  const [formConditions, setFormConditions] = useState<Condition[]>([emptyCondition()]);
  const [formActions, setFormActions] = useState<Action[]>([emptyAction()]);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // --- Fetch rules ---
  const fetchRules = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/rules", { cache: "no-store" });
      const body = (await res.json()) as RuleListResponse & RuleErrorResponse;
      if (!res.ok) {
        setError(body.error ?? "Failed to load rules.");
        return;
      }
      setRules(body.rules ?? []);
    } catch {
      setError("Failed to load rules. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRules();
  }, [fetchRules]);

  // --- Toggle enabled ---
  const handleToggleEnabled = useCallback(
    async (rule: Rule) => {
      try {
        const res = await fetch(`/api/rules/${rule.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabled: !rule.enabled }),
        });
        const body = (await res.json()) as RuleSingleResponse & RuleErrorResponse;
        if (!res.ok) {
          console.error("Failed to toggle rule:", body.error);
          return;
        }
        setRules((prev) =>
          prev.map((r) => (r.id === rule.id ? { ...r, enabled: !r.enabled } : r)),
        );
      } catch (e) {
        console.error("Failed to toggle rule:", e);
      }
    },
    [],
  );

  // --- Open create modal ---
  const handleOpenCreate = useCallback(() => {
    setEditingRuleId(null);
    setFormName("");
    setFormEvent("message_received");
    setFormConditions([emptyCondition()]);
    setFormActions([emptyAction()]);
    setFormError(null);
    setEditorOpen(true);
  }, []);

  // --- Open edit modal ---
  const handleOpenEdit = useCallback((rule: Rule) => {
    setEditingRuleId(rule.id);
    setFormName(rule.name);
    setFormEvent(rule.event);
    setFormConditions(
      rule.conditions.length > 0
        ? rule.conditions.map((c) => ({ field: c.field, operator: c.operator, value: String(c.value) }))
        : [emptyCondition()],
    );
    setFormActions(
      rule.actions.length > 0
        ? rule.actions.map((a) => ({ type: a.type, params: { ...a.params } as Record<string, string> }))
        : [emptyAction()],
    );
    setFormError(null);
    setEditorOpen(true);
  }, []);

  // --- Save (create or update) ---
  const handleSave = useCallback(async () => {
    setFormError(null);

    if (!formName.trim()) {
      setFormError("Rule name is required.");
      return;
    }

    if (formConditions.length === 0 || formConditions.some((c) => !c.field || !c.operator)) {
      setFormError("At least one valid condition is required.");
      return;
    }

    if (formActions.length === 0) {
      setFormError("At least one action is required.");
      return;
    }

    const payload = {
      name: formName.trim(),
      event: formEvent,
      conditions: formConditions.map((c) => ({
        field: c.field,
        operator: c.operator,
        value: c.value,
      })),
      actions: formActions.map((a) => ({
        type: a.type,
        params: a.params,
      })),
    };

    setSaving(true);
    try {
      if (editingRuleId) {
        // Update
        const res = await fetch(`/api/rules/${editingRuleId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const body = (await res.json()) as RuleSingleResponse & RuleErrorResponse;
        if (!res.ok) {
          setFormError(body.error ?? "Failed to update rule.");
          return;
        }
        setRules((prev) =>
          prev.map((r) => (r.id === editingRuleId ? body.rule : r)),
        );
      } else {
        // Create
        const res = await fetch("/api/rules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const body = (await res.json()) as RuleSingleResponse & RuleErrorResponse;
        if (!res.ok) {
          setFormError(body.error ?? "Failed to create rule.");
          return;
        }
        setRules((prev) => [...prev, body.rule]);
      }
      setEditorOpen(false);
    } catch (e) {
      setFormError(editingRuleId ? "Failed to update rule." : "Failed to create rule.");
      console.error(e);
    } finally {
      setSaving(false);
    }
  }, [formName, formEvent, formConditions, formActions, editingRuleId]);

  // --- Delete ---
  const handleDelete = useCallback(
    async (rule: Rule) => {
      const confirmed = window.confirm(
        `Are you sure you want to delete the rule "${rule.name}"? This cannot be undone.`,
      );
      if (!confirmed) return;

      try {
        const res = await fetch(`/api/rules/${rule.id}`, { method: "DELETE" });
        const body = (await res.json()) as RuleErrorResponse;
        if (!res.ok) {
          console.error("Failed to delete rule:", body.error);
          return;
        }
        setRules((prev) => prev.filter((r) => r.id !== rule.id));
      } catch (e) {
        console.error("Failed to delete rule:", e);
      }
    },
    [],
  );

  // --- Condition helpers ---
  const addCondition = () => {
    setFormConditions((prev) => [...prev, emptyCondition()]);
  };

  const removeCondition = (idx: number) => {
    setFormConditions((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== idx);
    });
  };

  const updateCondition = (idx: number, field: Partial<Condition>) => {
    setFormConditions((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, ...field } : c)),
    );
  };

  // --- Action helpers ---
  const addAction = () => {
    setFormActions((prev) => [...prev, emptyAction()]);
  };

  const removeAction = (idx: number) => {
    setFormActions((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== idx);
    });
  };

  const updateAction = (idx: number, field: Partial<Action>) => {
    setFormActions((prev) =>
      prev.map((a, i) => (i === idx ? { ...a, ...field } : a)),
    );
  };

  const updateActionParam = (idx: number, key: string, value: string) => {
    setFormActions((prev) =>
      prev.map((a, i) =>
        i === idx ? { ...a, params: { ...a.params, [key]: value } } : a,
      ),
    );
  };

  // --- Get param defs for a given action type ---
  const getParamDefs = (type: string) => {
    return ACTION_TYPE_DEFS.find((d) => d.value === type)?.paramDefs ?? [];
  };

  /* ================================================================= */
  /*  Render                                                           */
  /* ================================================================= */

  return (
    <main className="flex-1 min-w-0 min-h-0 overflow-auto bg-background p-6">
      <div className="mx-auto max-w-6xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Rules</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Event-driven rules that trigger actions based on conditions.
            </p>
          </div>
          <Button onClick={handleOpenCreate}>
            <span className="inline-flex items-center gap-1.5">
              <svg
                className="size-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Create Rule
            </span>
          </Button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center rounded-xl border border-border bg-card py-16">
            <p className="text-sm text-muted-foreground">Loading rules&hellip;</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16">
            <p className="text-sm font-medium text-red-500">{error}</p>
            <Button
              variant="outline"
              onClick={fetchRules}
              className="mt-3"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && rules.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-16">
            <p className="text-sm text-muted-foreground">
              No rules yet. Create your first rule to automate actions based on events.
            </p>
          </div>
        )}

        {/* Rule list */}
        {!loading && !error && rules.length > 0 && (
          <div className="space-y-3">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className={cn(
                  "flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/20",
                  !rule.enabled && "opacity-60",
                )}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <ToggleSwitch
                    enabled={rule.enabled}
                    onToggle={() => handleToggleEnabled(rule)}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {rule.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {getEventLabel(rule.event)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleOpenEdit(rule)}
                    title="Edit rule"
                  >
                    <svg
                      className="size-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                      />
                    </svg>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDelete(rule)}
                    title="Delete rule"
                  >
                    <svg
                      className="size-4 text-red-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                      />
                    </svg>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/*  Rule Editor Sheet / Modal                                    */}
      {/* ============================================================== */}
      <Sheet open={editorOpen} onOpenChange={setEditorOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-lg overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle>{editingRuleId ? "Edit Rule" : "Create Rule"}</SheetTitle>
            <SheetDescription>
              {editingRuleId
                ? "Update the rule name, event, conditions, or actions."
                : "Define a new rule with an event, conditions, and actions."}
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-5 p-4 pt-2">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Rule Name</label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Tag VIP customers"
              />
            </div>

            {/* Event */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Event</label>
              <div className="grid grid-cols-1 gap-1">
                {EVENT_TYPES.map((event) => (
                  <button
                    key={event}
                    type="button"
                    onClick={() => setFormEvent(event)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors cursor-pointer",
                      formEvent === event
                        ? "border-accent bg-accent/10 text-foreground"
                        : "border-border bg-card text-muted-foreground hover:border-border-hover hover:text-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "size-3.5 rounded-full border-2 flex items-center justify-center",
                        formEvent === event
                          ? "border-accent bg-accent"
                          : "border-muted-foreground",
                      )}
                    >
                      {formEvent === event && (
                        <span className="size-1.5 rounded-full bg-white" />
                      )}
                    </span>
                    {getEventLabel(event)}
                  </button>
                ))}
              </div>
            </div>

            {/* Conditions */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground">Conditions</label>
                <Button variant="ghost" size="xs" onClick={addCondition}>
                  <svg
                    className="size-3.5 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Add condition
                </Button>
              </div>
              {formConditions.map((cond, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 rounded-lg border border-border bg-card p-3"
                >
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <select
                      value={cond.field}
                      onChange={(e) => updateCondition(idx, { field: e.target.value })}
                      className="h-8 rounded-lg border border-border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {CONDITION_FIELDS.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                    <select
                      value={cond.operator}
                      onChange={(e) => updateCondition(idx, { operator: e.target.value })}
                      className="h-8 rounded-lg border border-border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {CONDITION_OPERATORS.map((op) => (
                        <option key={op.value} value={op.value}>
                          {op.label}
                        </option>
                      ))}
                    </select>
                    <Input
                      value={cond.value}
                      onChange={(e) => updateCondition(idx, { value: e.target.value })}
                      placeholder="Value"
                      className="h-8 text-xs"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => removeCondition(idx)}
                    disabled={formConditions.length <= 1}
                    title="Remove condition"
                  >
                    <svg
                      className="size-3.5 text-muted-foreground"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </Button>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground">Actions</label>
                <Button variant="ghost" size="xs" onClick={addAction}>
                  <svg
                    className="size-3.5 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Add action
                </Button>
              </div>
              {formActions.map((action, idx) => {
                const paramDefs = getParamDefs(action.type);
                return (
                  <div
                    key={idx}
                    className="rounded-lg border border-border bg-card p-3 space-y-2"
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 space-y-2">
                        <select
                          value={action.type}
                          onChange={(e) => {
                            const newType = e.target.value;
                            const def = ACTION_TYPE_DEFS.find((d) => d.value === newType);
                            const newParams: Record<string, string> = {};
                            if (def) {
                              def.paramDefs.forEach((p) => {
                                newParams[p.key] = "";
                              });
                            }
                            updateAction(idx, { type: newType, params: newParams });
                          }}
                          className="h-8 w-full rounded-lg border border-border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          {ACTION_TYPE_DEFS.map((ad) => (
                            <option key={ad.value} value={ad.value}>
                              {ad.label}
                            </option>
                          ))}
                        </select>
                        {paramDefs.map((def) => (
                          <Input
                            key={def.key}
                            value={action.params[def.key] ?? ""}
                            onChange={(e) => updateActionParam(idx, def.key, e.target.value)}
                            placeholder={def.placeholder}
                            className="h-8 text-xs"
                          />
                        ))}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => removeAction(idx)}
                        disabled={formActions.length <= 1}
                        title="Remove action"
                      >
                        <svg
                          className="size-3.5 text-muted-foreground"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Form error */}
            {formError && (
              <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900 px-3 py-2">
                <p className="text-xs font-medium text-red-600 dark:text-red-400">
                  {formError}
                </p>
              </div>
            )}

            {/* Save button */}
            <div className="pt-2">
              <Button
                className="w-full"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving\u2026" : editingRuleId ? "Save Changes" : "Create Rule"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </main>
  );
}
