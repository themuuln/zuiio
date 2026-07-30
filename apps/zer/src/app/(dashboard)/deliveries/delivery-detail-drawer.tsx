"use client";

import {
  ArrowRight,
  CheckCircle,
  Clock,
  MapPin,
  Phone,
  Truck,
  User,
  XCircle,
} from "@phosphor-icons/react/dist/ssr";
import { Badge } from "@/components/ui/badge";
import { DrawerLayout } from "@/components/ui/drawer-layout";
import { formatCurrency, formatDate } from "@/lib/format";
import { toast } from "sonner";

const STATUS_LABELS: Record<string, string> = {
  pending: "Хүлээгдэж буй",
  assigned: "Даалгасан",
  picked_up: "Авсан",
  in_transit: "Замдаа",
  delivered: "Хүргэгдсэн",
  cancelled: "Цуцлагдсан",
  failed: "Амжилтгүй",
};

function statusBadgeVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "delivered":
      return "default";
    case "pending":
    case "picked_up":
      return "secondary";
    case "cancelled":
    case "failed":
      return "destructive";
    case "assigned":
    case "in_transit":
      return "outline";
    default:
      return "outline";
  }
}

export interface DeliveryDetailData {
  id: string;
  sale_id: string;
  address: string | null;
  address_note: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  status: string;
  assigned_to: string | null;
  assigned_name: string | null;
  delivery_fee: number;
  notes: string | null;
  courier_notes: string | null;
  external_tracking_id: string | null;
  external_tracking_url: string | null;
  requested_at: string | null;
  estimated_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  zone_name: string | null;
  provider_name: string | null;
  sale_total: number | null;
  sale_contact_name: string | null;
  status_history: Array<{
    status: string;
    changed_by: string | null;
    changed_name: string | null;
    notes: string | null;
    created_at: string;
  }>;
}

export function DeliveryDetailDrawer({
  delivery,
  open,
  onOpenChange,
}: {
  delivery: DeliveryDetailData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <DrawerLayout
      open={open}
      onOpenChange={onOpenChange}
      title={`Хүргэлт #${delivery.sale_id?.slice(0, 8) ?? ""}`}
      description="Хүргэлтийн дэлгэрэнгүй мэдээлэл"
    >
      <div className="space-y-6">
        {/* Status */}
        <div className="flex items-center gap-2">
          <Badge variant={statusBadgeVariant(delivery.status)}>
            {STATUS_LABELS[delivery.status] ?? delivery.status}
          </Badge>
        </div>

        {/* Status Actions */}
        {delivery.status === "pending" && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={async () => {
                try {
                  const { updateDeliveryStatus } = await import("./actions");
                  const result = await updateDeliveryStatus(
                    delivery.id,
                    "assigned",
                    "Курьер даалгасан",
                  );
                  if ("error" in result) {
                    toast.error(result.error);
                  } else {
                    toast.success("Даалгасан");
                  }
                } catch {
                  toast.error("Алдаа гарлаа");
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <User className="size-3.5" />
              Даалгах
            </button>
            <button
              type="button"
              onClick={async () => {
                try {
                  const { updateDeliveryStatus } = await import("./actions");
                  const result = await updateDeliveryStatus(
                    delivery.id,
                    "cancelled",
                    "Цуцалсан",
                  );
                  if ("error" in result) {
                    toast.error(result.error);
                  } else {
                    toast.success("Хүргэлт цуцалсан");
                  }
                } catch {
                  toast.error("Алдаа гарлаа");
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
            >
              <XCircle className="size-3.5" />
              Цуцлах
            </button>
          </div>
        )}
        {delivery.status === "assigned" && (
          <button
            type="button"
            onClick={async () => {
              try {
                const { updateDeliveryStatus } = await import("./actions");
                const result = await updateDeliveryStatus(
                  delivery.id,
                  "picked_up",
                  "Хүргэлтийг авсан",
                );
                if ("error" in result) {
                  toast.error(result.error);
                } else {
                  toast.success("Авсан");
                }
              } catch {
                toast.error("Алдаа гарлаа");
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-600 transition-colors"
          >
            <CheckCircle className="size-3.5" />
            Авсан
          </button>
        )}
        {delivery.status === "picked_up" && (
          <button
            type="button"
            onClick={async () => {
              try {
                const { updateDeliveryStatus } = await import("./actions");
                const result = await updateDeliveryStatus(
                  delivery.id,
                  "in_transit",
                  "Хүргэлт замдаа гарсан",
                );
                if ("error" in result) {
                  toast.error(result.error);
                } else {
                  toast.success("Замдаа");
                }
              } catch {
                toast.error("Алдаа гарлаа");
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-600 transition-colors"
          >
            <ArrowRight className="size-3.5" />
            Замдаа гаргах
          </button>
        )}
        {delivery.status === "in_transit" && (
          <button
            type="button"
            onClick={async () => {
              try {
                const { updateDeliveryStatus } = await import("./actions");
                const result = await updateDeliveryStatus(
                  delivery.id,
                  "delivered",
                  "Амжилттай хүргэгдсэн",
                );
                if ("error" in result) {
                  toast.error(result.error);
                } else {
                  toast.success("Хүргэгдсэн!");
                }
              } catch {
                toast.error("Алдаа гарлаа");
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-green-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-600 transition-colors"
          >
            <CheckCircle className="size-3.5" />
            Хүргэгдсэн
          </button>
        )}

        {/* Delivery fee card */}
        <div className="rounded-xl border border-border/80 bg-muted/40 p-4">
          <p className="text-xs text-muted-foreground">Хүргэлтийн төлбөр</p>
          <p className="mt-1 text-2xl font-semibold">
            {delivery.delivery_fee > 0
              ? formatCurrency(delivery.delivery_fee)
              : "Үнэгүй"}
          </p>
          {delivery.zone_name && (
            <p className="mt-0.5 text-sm text-muted-foreground">
              Бүс: {delivery.zone_name}
            </p>
          )}
          {delivery.provider_name && (
            <p className="text-sm text-muted-foreground">
              Үйлчилгээ: {delivery.provider_name}
            </p>
          )}
        </div>

        {/* Contact & Address */}
        <div className="divide-y rounded-xl border border-border/80">
          <div className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <User className="size-4" />
              Холбогдох хүн
            </span>
            <span className="font-medium text-right">
              {delivery.contact_name ?? "-"}
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Phone className="size-4" />
              Утас
            </span>
            <span className="font-medium">{delivery.contact_phone ?? "-"}</span>
          </div>
          <div className="px-4 py-3 text-sm">
            <span className="flex items-center gap-2 text-muted-foreground mb-1">
              <MapPin className="size-4" />
              Хаяг
            </span>
            <span className="block font-medium">
              {delivery.address ?? "-"}
            </span>
            {delivery.address_note && (
              <span className="block mt-1 text-xs text-muted-foreground">
                Тэмдэглэл: {delivery.address_note}
              </span>
            )}
          </div>
        </div>

        {/* Timeline */}
        {delivery.status_history.length > 0 && (
          <div>
            <h4 className="mb-3 text-sm font-medium text-muted-foreground">
              Төлөв өөрчлөлтүүд
            </h4>
            <div className="space-y-3">
              {delivery.status_history.map((h, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="flex size-5 shrink-0 items-center justify-center">
                      <div className="size-2 rounded-full bg-border" />
                    </div>
                    {i < delivery.status_history.length - 1 && (
                      <div className="w-px flex-1 bg-border" />
                    )}
                  </div>
                  <div className="flex-1 pb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={statusBadgeVariant(h.status)}>
                        {STATUS_LABELS[h.status] ?? h.status}
                      </Badge>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{h.changed_name ?? "Систем"}</span>
                      <span>•</span>
                      <span>{formatDate(h.created_at)}</span>
                    </div>
                    {h.notes && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {h.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Assigned staff */}
        {delivery.assigned_name && (
          <div className="rounded-xl border border-border/80 p-4">
            <span className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <User className="size-4" />
              Хариуцагч
            </span>
            <p className="text-sm font-medium">{delivery.assigned_name}</p>
            {delivery.courier_notes && (
              <p className="mt-1 text-xs text-muted-foreground">
                Тэмдэглэл: {delivery.courier_notes}
              </p>
            )}
          </div>
        )}

        {/* Tracking info */}
        {delivery.external_tracking_id && (
          <div className="rounded-xl border border-border/80 p-4">
            <span className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Truck className="size-4" />
              Хяналтын мэдээлэл
            </span>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-mono text-xs">
                {delivery.external_tracking_id}
              </span>
              {delivery.external_tracking_url && (
                <a
                  href={delivery.external_tracking_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  Хянах
                  <ArrowRight className="size-3" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        {delivery.notes && (
          <div className="rounded-xl border border-border/80 p-4">
            <span className="block text-xs text-muted-foreground mb-1">
              Тэмдэглэл
            </span>
            <p className="text-sm">{delivery.notes}</p>
          </div>
        )}

        {/* Dates */}
        <div className="divide-y rounded-xl border border-border/80">
          {delivery.requested_at && (
            <div className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Clock className="size-4" />
                Хүсэлт гаргасан
              </span>
              <span className="font-medium">{formatDate(delivery.requested_at)}</span>
            </div>
          )}
          {delivery.estimated_at && (
            <div className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Clock className="size-4" />
                Тооцоолсон
              </span>
              <span className="font-medium">{formatDate(delivery.estimated_at)}</span>
            </div>
          )}
          {delivery.picked_up_at && (
            <div className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="text-muted-foreground">Авсан</span>
              <span className="font-medium">{formatDate(delivery.picked_up_at)}</span>
            </div>
          )}
          {delivery.delivered_at && (
            <div className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="text-muted-foreground">Хүргэгдсэн</span>
              <span className="font-medium">{formatDate(delivery.delivered_at)}</span>
            </div>
          )}
        </div>
      </div>
    </DrawerLayout>
  );
}
