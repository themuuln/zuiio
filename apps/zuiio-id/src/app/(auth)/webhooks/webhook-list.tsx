"use client";

import { useState } from "react";

interface WebhookSubscription {
  id: string;
  product_id: string;
  url: string;
  events: string[];
  active: boolean;
  created_at: string;
  product_catalog?: { display_name: string } | null;
}

export function WebhookList({
  subscriptions,
}: {
  subscriptions: WebhookSubscription[];
}) {
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/webhooks/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        window.location.reload();
      }
    } finally {
      setDeleting(null);
    }
  }

  if (subscriptions.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Вебхүүк тохируулаагүй байна.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {subscriptions.map((sub) => (
        <div
          key={sub.id}
          className="flex items-start justify-between rounded-lg border border-border bg-card px-4 py-3"
        >
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-foreground break-all">
              {sub.url}
            </span>
            <span className="text-xs text-muted-foreground">
              {sub.product_catalog?.display_name ?? sub.product_id} ·{" "}
              {sub.events.length > 0 ? sub.events.join(", ") : "Бүх үйлдэл"}
            </span>
            <span className="text-xs text-muted-foreground">
              {new Date(sub.created_at).toLocaleDateString("mn-MN")}
            </span>
          </div>
          <button
            type="button"
            onClick={() => void handleDelete(sub.id)}
            disabled={deleting === sub.id}
            className="text-xs text-destructive hover:text-destructive/80 disabled:opacity-50"
          >
            {deleting === sub.id ? "Устгаж байна…" : "Устгах"}
          </button>
        </div>
      ))}
    </div>
  );
}
