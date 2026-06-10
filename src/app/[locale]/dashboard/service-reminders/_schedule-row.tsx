"use client";

import {
  Bell,
  BellOff,
  CheckCircle,
  FileText,
  Phone,
  Pencil,
  SkipForward,
  Trash2,
  XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ServiceScheduleItem } from "@/lib/queries/use-service-reminders";
import { DueStatusBadge, StatusBadge } from "./_badges";
import {
  formatDate,
  formatInterval,
  formatVehicleLabel,
  getScheduleDueStatus,
} from "./_utils";

interface ScheduleRowProps {
  item: ServiceScheduleItem;
  onEdit: (item: ServiceScheduleItem) => void;
  onDelete: (id: string) => void;
  onContactStatusChange: (id: string, status: string) => void;
}

export function ScheduleRow({
  item,
  onEdit,
  onDelete,
  onContactStatusChange,
}: ScheduleRowProps) {
  const t = useTranslations();
  const dueStatus = getScheduleDueStatus(item);
  const customer = item.vehicle?.customer;
  const customerName = customer
    ? `${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim()
    : null;
  const phone = customer?.phone;

  return (
    <TableRow>
      {/* Vehicle */}
      <TableCell className="font-medium">
        <span className="truncate">{formatVehicleLabel(item.vehicle)}</span>
      </TableCell>

      {/* Service + Notes */}
      <TableCell>
        <div className="flex flex-col gap-0.5">
          <span className="font-medium">{item.service_name}</span>
          {item.notes && (
            <Tooltip>
              <TooltipTrigger>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <FileText className="size-3" />
                  <span className="truncate max-w-[120px]">{item.notes}</span>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-[200px] text-xs">{item.notes}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </TableCell>

      {/* Customer */}
      <TableCell>
        {customerName ? (
          <div className="flex flex-col gap-0.5">
            <span className="text-sm">{customerName}</span>
            {phone && (
              <a
                href={`tel:${phone}`}
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                <Phone className="size-3" />
                {phone}
              </a>
            )}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </TableCell>

      {/* Interval */}
      <TableCell>
        <span className="text-sm text-muted-foreground">
          {formatInterval(item.interval_months, item.interval_km)}
        </span>
      </TableCell>

      {/* Last Service */}
      <TableCell>
        <span className="text-sm">
          {item.last_service_date ? formatDate(item.last_service_date) : "—"}
        </span>
      </TableCell>

      {/* Next Due */}
      <TableCell>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {item.next_due_date ? formatDate(item.next_due_date) : "—"}
            </span>
            <DueStatusBadge status={dueStatus} />
          </div>
          {item.next_due_km && (
            <span className="text-xs text-muted-foreground">
              {item.next_due_km.toLocaleString()} km
            </span>
          )}
        </div>
      </TableCell>

      {/* Reminder */}
      <TableCell>
        {item.reminder_enabled ? (
          <Bell className="size-4 text-primary" />
        ) : (
          <BellOff className="size-4 text-muted-foreground" />
        )}
      </TableCell>

      {/* Contact Status */}
      <TableCell>
        <StatusBadge status={item.contact_status ?? "pending"} />
      </TableCell>

      {/* Actions */}
      <TableCell>
        <div className="flex items-center gap-1">
          {/* Contact Status Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={t("serviceReminders.updateContactStatus")}
              >
                <CheckCircle className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() =>
                  onContactStatusChange(item.id, "called-scheduled")
                }
              >
                <CheckCircle className="size-4 text-green-600" />
                {t("serviceReminders.markScheduled")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  onContactStatusChange(item.id, "called-no-answer")
                }
              >
                <XCircle className="size-4 text-amber-600" />
                {t("serviceReminders.markNoAnswer")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onContactStatusChange(item.id, "skipped")}
              >
                <SkipForward className="size-4 text-muted-foreground" />
                {t("serviceReminders.markSkipped")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onEdit(item)}
            aria-label={t("common.edit")}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onDelete(item.id)}
            aria-label={t("common.delete")}
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
