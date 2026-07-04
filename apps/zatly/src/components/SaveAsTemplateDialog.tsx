"use client";

import { useState, useCallback } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFlowStore } from "@/store/flowStore";
import { useToastStore } from "@/store/toastStore";
import { TEMPLATE_CATEGORIES, CATEGORY_LABELS } from "@/types/template";
import type { TemplateCategory } from "@/types/template";

interface SaveAsTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SaveAsTemplateDialog({
  open,
  onOpenChange,
}: SaveAsTemplateDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TemplateCategory>("general");
  const [nameError, setNameError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const exportFlow = useFlowStore((s) => s.exportFlow);
  const addToast = useToastStore((s) => s.addToast);

  const resetForm = useCallback(() => {
    setName("");
    setDescription("");
    setCategory("general");
    setNameError(null);
    setSubmitError(null);
    setSubmitting(false);
  }, []);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        resetForm();
      }
      onOpenChange(nextOpen);
    },
    [onOpenChange, resetForm],
  );

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      // Validate required name
      if (!name.trim()) {
        setNameError("Template name is required.");
        return;
      }
      setNameError(null);
      setSubmitError(null);

      // Get current flow from store
      const flow = exportFlow();

      setSubmitting(true);
      try {
        const response = await fetch("/api/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim(),
            category,
            flow_json: flow,
          }),
        });

        const data = (await response.json()) as {
          error?: string;
          template?: unknown;
        };

        if (!response.ok) {
          setSubmitError(
            data.error ?? `Request failed (${response.status})`,
          );
          return;
        }

        // Success
        addToast({ message: "Template saved successfully!", type: "success" });
        handleOpenChange(false);
      } catch (err) {
        setSubmitError(
          err instanceof Error ? err.message : "Failed to save template.",
        );
      } finally {
        setSubmitting(false);
      }
    },
    [name, description, category, exportFlow, addToast, handleOpenChange],
  );

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange} modal>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/40 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-backdrop-filter:backdrop-blur-sm" />
        <DialogPrimitive.Popup className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-surface p-6 shadow-2xl transition-all duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 data-ending-style:scale-95 data-starting-style:scale-95">
          <DialogPrimitive.Title className="m-0 text-lg font-semibold text-text">
            Save as Template
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="mt-1 text-sm text-text-muted">
            Save the current flow as a reusable template.
          </DialogPrimitive.Description>

          <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
            {/* Name field */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="template-name" className="text-sm font-medium text-text">
                Name <span className="text-red">*</span>
              </Label>
              <Input
                id="template-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (nameError) setNameError(null);
                }}
                placeholder="My Template"
                className={nameError ? "border-red" : ""}
                aria-invalid={!!nameError}
                disabled={submitting}
              />
              {nameError && (
                <p className="m-0 text-xs text-red">{nameError}</p>
              )}
            </div>

            {/* Description field */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="template-description" className="text-sm font-medium text-text">
                Description
              </Label>
              <Input
                id="template-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this template"
                disabled={submitting}
              />
            </div>

            {/* Category field */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="template-category" className="text-sm font-medium text-text">
                Category
              </Label>
              <Select
                value={category}
                onValueChange={(val: string | null) => {
                  if (val) setCategory(val as TemplateCategory);
                }}
                disabled={submitting}
              >
                <SelectTrigger className="w-full" id="template-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {CATEGORY_LABELS[cat]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Submit error */}
            {submitError && (
              <div className="rounded-lg border border-red/30 bg-red/10 px-3 py-2">
                <p className="m-0 text-xs text-red">{submitError}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={submitting}
                className="h-9 rounded-lg border border-border bg-surface px-4 text-sm font-medium text-text transition-all hover:bg-surface-2 disabled:opacity-50 cursor-pointer"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="h-9 rounded-lg border border-accent/60 bg-accent/15 px-4 text-sm font-medium text-text transition-all hover:bg-accent/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {submitting ? "Saving..." : "Save Template"}
              </button>
            </div>
          </form>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
