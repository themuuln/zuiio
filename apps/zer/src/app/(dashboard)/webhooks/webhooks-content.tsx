"use client";

import { NotePencil, Trash, WebhooksLogo } from "@phosphor-icons/react";
import type { ColumnDef } from "@tanstack/react-table";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ErpEmptyState } from "@/components/erp/empty-state";
import { PageShell } from "@/components/erp/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Switch } from "@/components/ui/switch";
import {
  EVENT_TYPE_LABELS,
  WebhookCreateDrawer,
} from "@/components/webhooks/webhook-create-drawer";
import { WebhookEditDrawer } from "@/components/webhooks/webhook-edit-drawer";
import { formatDate } from "@/lib/format";
import { actionsColumn } from "@/lib/table-columns";
import { deleteWebhook, toggleWebhookActive } from "./actions";
import type { WebhookRow } from "./page";

export function WebhooksContent({
  webhooks,
  eventTypes,
}: {
  webhooks: WebhookRow[];
  eventTypes: string[];
}) {
  const searchParams = useSearchParams();
  const [createOpen, setCreateOpen] = useState(
    searchParams.get("create") === "true",
  );
  const [editWebhook, setEditWebhook] = useState<WebhookRow | null>(null);
  const initialCreateRef = useRef(createOpen);

  useEffect(() => {
    if (initialCreateRef.current) {
      window.history.replaceState({}, "", "/webhooks");
    }
  }, []);

  const runToggle = async (webhook: WebhookRow, isActive: boolean) => {
    const result = await toggleWebhookActive(webhook.id, isActive);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success(isActive ? "Вебхук идэвхжсэн." : "Вебхук идэвхгүй боллоо.");
  };

  const runDelete = async (webhook: WebhookRow) => {
    const confirmed = window.confirm(
      `"${webhook.name}" вебхукийг устгахдаа итгэлтэй байна уу?`,
    );
    if (!confirmed) return;
    const result = await deleteWebhook(webhook.id);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Вебхук устгагдлаа.");
  };

  if (webhooks.length === 0) {
    return (
      <PageShell
        title="Вебхук"
        description="Гадны системд үйл явдлын мэдээлэл илгээх"
      >
        <ErpEmptyState
          icon={<WebhooksLogo className="size-4" />}
          title="Вебхук байхгүй"
          description="Шинэ вебхук үүсгэж, ERP үйл явдлыг гадны системд холбоно уу."
          action={
            <WebhookCreateDrawer
              open={createOpen}
              onOpenChange={setCreateOpen}
              eventTypes={eventTypes}
            />
          }
        />
      </PageShell>
    );
  }

  const columns: ColumnDef<WebhookRow>[] = [
    {
      accessorKey: "name",
      header: "Нэр",
    },
    {
      accessorKey: "url",
      header: "URL",
      cell: ({ row }) => (
        <code className="line-clamp-1 max-w-xs rounded bg-muted px-1.5 py-0.5 text-xs">
          {row.original.url}
        </code>
      ),
    },
    {
      id: "event_types",
      header: "Үйл явдлууд",
      cell: ({ row }) => (
        <div className="flex max-w-xs flex-wrap gap-1">
          {row.original.event_types.slice(0, 3).map((eventType) => (
            <Badge key={eventType} variant="secondary" className="text-[10px]">
              {EVENT_TYPE_LABELS[eventType] ?? eventType}
            </Badge>
          ))}
          {row.original.event_types.length > 3 && (
            <Badge variant="outline" className="text-[10px]">
              +{row.original.event_types.length - 3}
            </Badge>
          )}
        </div>
      ),
    },
    {
      id: "deliveries",
      header: "Хүргэлт",
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.delivery_count}
          {row.original.failed_count > 0 && (
            <span className="ml-1 text-destructive">
              ({row.original.failed_count} алдаа)
            </span>
          )}
        </span>
      ),
    },
    {
      accessorFn: (row) => (row.is_active ? "Тийм" : "Үгүй"),
      id: "is_active",
      header: "Идэвхтэй",
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? "default" : "secondary"}>
          {row.original.is_active ? "Тийм" : "Үгүй"}
        </Badge>
      ),
    },
    {
      id: "created_at",
      header: "Үүсгэсэн",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {formatDate(row.original.created_at)}
        </span>
      ),
    },
    actionsColumn("", (row) => (
      <div className="flex items-center gap-1">
        <span className="flex items-center gap-1.5">
          <Switch
            checked={row.is_active}
            onCheckedChange={(checked) => runToggle(row, checked)}
            aria-label="Идэвхтэй эсэх"
          />
        </span>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Засах"
          onClick={() => setEditWebhook(row)}
        >
          <NotePencil className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive"
          aria-label="Устгах"
          onClick={() => runDelete(row)}
        >
          <Trash className="size-4" />
        </Button>
      </div>
    )),
  ];

  return (
    <>
      <PageShell
        title="Вебхук"
        description="Гадны системд үйл явдлын мэдээлэл илгээх"
        actions={
          <WebhookCreateDrawer
            open={createOpen}
            onOpenChange={setCreateOpen}
            eventTypes={eventTypes}
          />
        }
      >
        <DataTable
          columns={columns}
          data={webhooks}
          searchColumn="name"
          searchPlaceholder="Хайх..."
          pageSize={10}
          totalLabel="вебхук"
          enableSorting
          enableColumnVisibility
        />
      </PageShell>
      <WebhookEditDrawer
        webhook={editWebhook ?? ({} as WebhookRow)}
        open={!!editWebhook}
        onOpenChange={(open) => {
          if (!open) setEditWebhook(null);
        }}
        eventTypes={eventTypes}
      />
    </>
  );
}
