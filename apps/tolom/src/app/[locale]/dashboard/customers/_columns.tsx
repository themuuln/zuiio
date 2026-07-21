"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Building2, Car, ChevronRight, Clock, Globe, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/ui/data-table";
import { Typography } from "@/components/ui/typography";
import type { Customer } from "@/lib/types";

export interface CustomerRow extends Customer {
  vehicle_count?: number;
  organization_name?: string;
}

function getCustomerDisplayName(
  customer: CustomerRow,
  t?: (key: string) => string,
): string {
  return (
    [customer.first_name, customer.last_name].filter(Boolean).join(" ") ||
    customer.company_name ||
    customer.contact_person ||
    customer.full_name ||
    customer.phone ||
    (t ? t("noName") : "No name")
  );
}

function formatDate(
  dateString: string | null,
  t?: (key: string, values?: Record<string, number>) => string,
): string | null {
  if (!dateString) return null;
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return t ? t("today") : "Today";
  if (days === 1) return t ? t("yesterday") : "Yesterday";
  if (days < 7) return t ? t("daysAgo", { days }) : `${days} days ago`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return t
      ? t("weeksAgo", { weeks })
      : `${weeks} week${weeks > 1 ? "s" : ""} ago`;
  }
  return date.toLocaleDateString();
}

export const columns: ColumnDef<CustomerRow>[] = [
  {
    id: "name",
    accessorFn: (row) => getCustomerDisplayName(row),
    header: ({ column }) => {
      const t = useTranslations("customers") as (key: string, values?: Record<string, string | number>) => string;
      return <DataTableColumnHeader column={column} title={t("name")} />;
    },
    cell: ({ row }) => {
      const t = useTranslations("customers") as (key: string, values?: Record<string, string | number>) => string;
      const customer = row.original;
      return (
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/60 ring-1 ring-border">
            {customer.type === "company" ? (
              <Building2 className="size-4 text-muted-foreground/70" />
            ) : (
              <User className="size-4 text-muted-foreground/70" />
            )}
          </div>
          <div className="min-w-0">
            <Typography.Text className="truncate text-sm font-medium">
              {getCustomerDisplayName(customer, t as (key: string) => string)}
            </Typography.Text>
            <Typography.Muted className="text-xs text-muted-foreground capitalize">
              {customer.type}
            </Typography.Muted>
          </div>
        </div>
      );
    },
  },
  {
    id: "contact",
    header: ({ column }) => {
      const t = useTranslations("customers") as (key: string, values?: Record<string, string | number>) => string;
      return <DataTableColumnHeader column={column} title={t("contact")} />;
    },
    cell: ({ row }) => {
      const customer = row.original;
      return (
        <div className="min-w-0 max-w-44">
          {customer.phone ? (
            <Typography.Text className="truncate text-sm">
              {customer.phone}
            </Typography.Text>
          ) : customer.email ? (
            <Typography.Muted className="truncate text-sm text-muted-foreground">
              {customer.email}
            </Typography.Muted>
          ) : (
            <span className="text-sm text-muted-foreground/50">&mdash;</span>
          )}
        </div>
      );
    },
  },
  {
    id: "vehicles",
    accessorKey: "vehicle_count",
    header: ({ column }) => {
      const t = useTranslations("customers") as (key: string, values?: Record<string, string | number>) => string;
      return <DataTableColumnHeader column={column} title={t("vehicles")} />;
    },
    cell: ({ row }) => (
      <Badge variant="secondary" className="gap-1 tabular-nums">
        <Car className="size-3 text-muted-foreground/60" />
        {row.original.vehicle_count ?? 0}
      </Badge>
    ),
  },
  {
    id: "total_visits",
    accessorKey: "total_visits",
    meta: { align: "right" } as const,
    header: ({ column }) => {
      const t = useTranslations("customers") as (key: string, values?: Record<string, string | number>) => string;
      return <DataTableColumnHeader column={column} title={t("visits")} />;
    },
    cell: ({ row }) => (
      <span className="text-sm tabular-nums">{row.original.total_visits}</span>
    ),
  },
  {
    id: "last_visit",
    accessorKey: "last_visit_at",
    header: ({ column }) => {
      const t = useTranslations("customers") as (key: string, values?: Record<string, string | number>) => string;
      return <DataTableColumnHeader column={column} title={t("lastVisit")} />;
    },
    cell: ({ row }) => {
      const t = useTranslations("customers") as (key: string, values?: Record<string, string | number>) => string;
      const lastVisit = formatDate(row.original.last_visit_at, t as (key: string, values?: Record<string, number>) => string);
      return lastVisit ? (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="size-3.5 shrink-0 text-muted-foreground/50" />
          <span>{lastVisit}</span>
        </div>
      ) : (
        <span className="text-sm text-muted-foreground/50">{t("never")}</span>
      );
    },
  },
  {
    id: "chevron",
    header: "",
    enableSorting: false,
    cell: () => <ChevronRight className="size-4 text-muted-foreground/40" />,
  },
];

/** Columns for shared (cross-org) customers — includes org attribution badge */
export const sharedColumns: ColumnDef<CustomerRow>[] = [
  {
    id: "name",
    accessorFn: (row) => getCustomerDisplayName(row),
    header: ({ column }) => {
      const t = useTranslations("customers") as (key: string, values?: Record<string, string | number>) => string;
      return <DataTableColumnHeader column={column} title={t("name")} />;
    },
    cell: ({ row }) => {
      const t = useTranslations("customers") as (key: string, values?: Record<string, string | number>) => string;
      const customer = row.original;
      return (
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/60 ring-1 ring-border">
            {customer.type === "company" ? (
              <Building2 className="size-4 text-muted-foreground/70" />
            ) : (
              <User className="size-4 text-muted-foreground/70" />
            )}
          </div>
          <div className="min-w-0">
            <Typography.Text className="truncate text-sm font-medium">
              {getCustomerDisplayName(customer, t as (key: string) => string)}
            </Typography.Text>
            <div className="flex items-center gap-1">
              <Typography.Muted className="text-xs text-muted-foreground capitalize">
                {customer.type}
              </Typography.Muted>
              {customer.organization_name && (
                <Badge
                  variant="outline"
                  className="gap-1 text-[10px] px-1.5 py-0"
                >
                  <Globe className="size-2.5" />
                  {customer.organization_name}
                </Badge>
              )}
            </div>
          </div>
        </div>
      );
    },
  },
  {
    id: "contact",
    header: ({ column }) => {
      const t = useTranslations("customers") as (key: string, values?: Record<string, string | number>) => string;
      return <DataTableColumnHeader column={column} title={t("contact")} />;
    },
    cell: ({ row }) => {
      const customer = row.original;
      return (
        <div className="min-w-0 max-w-44">
          {customer.phone ? (
            <Typography.Text className="truncate text-sm">
              {customer.phone}
            </Typography.Text>
          ) : customer.email ? (
            <Typography.Muted className="truncate text-sm text-muted-foreground">
              {customer.email}
            </Typography.Muted>
          ) : (
            <span className="text-sm text-muted-foreground/50">&mdash;</span>
          )}
        </div>
      );
    },
  },
  {
    id: "vehicles",
    accessorKey: "vehicle_count",
    header: ({ column }) => {
      const t = useTranslations("customers") as (key: string, values?: Record<string, string | number>) => string;
      return <DataTableColumnHeader column={column} title={t("vehicles")} />;
    },
    cell: ({ row }) => (
      <Badge variant="secondary" className="gap-1 tabular-nums">
        <Car className="size-3 text-muted-foreground/60" />
        {row.original.vehicle_count ?? 0}
      </Badge>
    ),
  },
  {
    id: "last_visit",
    accessorKey: "last_visit_at",
    header: ({ column }) => {
      const t = useTranslations("customers") as (key: string, values?: Record<string, string | number>) => string;
      return <DataTableColumnHeader column={column} title={t("lastVisit")} />;
    },
    cell: ({ row }) => {
      const t = useTranslations("customers") as (key: string, values?: Record<string, string | number>) => string;
      const lastVisit = formatDate(row.original.last_visit_at, t as (key: string, values?: Record<string, number>) => string);
      return lastVisit ? (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="size-3.5 shrink-0 text-muted-foreground/50" />
          <span>{lastVisit}</span>
        </div>
      ) : (
        <span className="text-sm text-muted-foreground/50">{t("never")}</span>
      );
    },
  },
  {
    id: "chevron",
    header: "",
    enableSorting: false,
    cell: () => <ChevronRight className="size-4 text-muted-foreground/40" />,
  },
];
