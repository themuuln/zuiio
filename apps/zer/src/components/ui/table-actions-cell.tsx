"use client";

import { Eye, NotePencil, Trash } from "@phosphor-icons/react";
import { buttonVariants } from "@/components/ui/button";

export interface TableActionsCellProps {
  /** Callback when the eye (detail) button is clicked */
  onView?: () => void;
  /** Callback when the pencil (edit) button is clicked */
  onEdit?: () => void;
  /** Callback when the trash (delete) button is clicked */
  onDelete?: () => void;
  /** Whether the delete action is pending */
  isDeletePending?: boolean;
  /** Whether the delete action is disabled */
  disableDelete?: boolean;
  /** Whether the edit action is disabled */
  disableEdit?: boolean;
  /** Whether the view action is disabled */
  disableView?: boolean;
}

/**
 * Standardized action cell for data tables.
 * Renders up to three icon buttons: View (eye), Edit (pencil), Delete (trash).
 * Must be wrapped in a container that stops click propagation from row clicks.
 */
export function TableActionsCell({
  onView,
  onEdit,
  onDelete,
  isDeletePending = false,
  disableDelete = false,
  disableEdit = false,
  disableView = false,
}: TableActionsCellProps) {
  const hasAny = onView || onEdit || onDelete;
  if (!hasAny) return null;

  return (
    <div
      className="flex items-center gap-1"
      onClick={(e) => e.stopPropagation()}
    >
      {onView && (
        <button
          type="button"
          onClick={onView}
          disabled={disableView}
          className={buttonVariants({ variant: "ghost", size: "icon-xs" })}
          title="Дэлгэрэнгүй"
        >
          <Eye className="size-3.5" />
        </button>
      )}
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          disabled={disableEdit}
          className={buttonVariants({ variant: "ghost", size: "icon-xs" })}
          title="Засах"
        >
          <NotePencil className="size-3.5" />
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          disabled={disableDelete || isDeletePending}
          className={buttonVariants({ variant: "ghost", size: "icon-xs" })}
          title="Устгах"
        >
          <Trash className="size-3.5" />
        </button>
      )}
    </div>
  );
}
