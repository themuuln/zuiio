"use client";

import { Pencil } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Click-to-edit text field (InlineEditableField from @zuiio/ui is
 * number-only). Display mode renders a plain text node with a pencil
 * hint on hover; focus swaps it to an input/textarea. Commits on blur
 * or Enter, cancels on Escape.
 */

interface EditableTextProps {
  value: string;
  onSave: (value: string) => void;
  multiline?: boolean;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  /** Show the pencil hint icon (default: true) */
  showPencil?: boolean;
  /** Parent-driven edit request: when the value changes, enter edit mode */
  editRequest?: number;
}

export function EditableText({
  value,
  onSave,
  multiline = false,
  placeholder,
  className,
  inputClassName,
  showPencil = true,
  editRequest,
}: EditableTextProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevEditRequest = useRef(editRequest);

  useEffect(() => {
    if (editRequest !== undefined && editRequest !== prevEditRequest.current) {
      setDraft(value);
      setEditing(true);
    }
    prevEditRequest.current = editRequest;
  }, [editRequest, value]);

  useEffect(() => {
    if (!editing) return;
    const el = multiline ? textareaRef.current : inputRef.current;
    el?.focus();
    if (el && !multiline) el.select();
  }, [editing, multiline]);

  const commit = useCallback(() => {
    setEditing(false);
    const next = draft.trim();
    if (next !== value) onSave(next);
  }, [draft, value, onSave]);

  const cancel = useCallback(() => {
    setEditing(false);
    setDraft(value);
  }, [value]);

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setDraft(value);
          setEditing(true);
        }}
        className={cn(
          "group/edit inline-flex max-w-full items-center gap-1 rounded text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className,
        )}
        title={value || placeholder}
      >
        <span className="truncate">{value || placeholder}</span>
        {showPencil && (
          <Pencil className="size-3 shrink-0 opacity-0 transition-opacity group-hover/edit:opacity-60 group-focus-visible/edit:opacity-60" />
        )}
      </button>
    );
  }

  const commonProps = {
    value: draft,
    placeholder,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setDraft(e.target.value),
    onBlur: commit,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !multiline) commit();
      if (e.key === "Escape") cancel();
    },
    className: cn(
      "w-full rounded-md border border-primary/40 bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring",
      inputClassName,
    ),
  };

  return multiline ? (
    <textarea rows={3} {...commonProps} ref={textareaRef} />
  ) : (
    <input {...commonProps} ref={inputRef} />
  );
}
