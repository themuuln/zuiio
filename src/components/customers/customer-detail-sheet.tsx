"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Save,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  CustomerEditForm,
  type CustomerFormState,
} from "@/app/[locale]/dashboard/customers/[id]/_customer-edit-form";
import { StatusBadge } from "@/components/status-badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { DetailSheet } from "@/components/ui/detail-sheet";
import { DetailSheetHeader } from "@/components/ui/detail-sheet-header";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";
import { SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Typography } from "@/components/ui/typography";
import { usePageHeader } from "@/hooks/use-page-header";
import { customerKeys } from "@/lib/queries/keys";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import type { WorkOrderStatus } from "@/lib/types";
import { formatMNT } from "@/lib/utils";

type CustomerType = "individual" | "company";

interface CustomerVehicleSummary {
  id: string;
  plate_number: string;
  make: string;
  model: string;
  year: number | null;
}

interface WorkOrderSummary {
  id: string;
  status: WorkOrderStatus;
  description: string | null;
  complaint: string | null;
  total: number;
  created_at: string;
  vehicles?: { plate_number: string; make: string; model: string } | null;
}

interface CustomerDetailResponse {
  id: string;
  type: CustomerType;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  company_name: string | null;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  source: string | null;
  created_at: string;
  vehicles: CustomerVehicleSummary[];
  work_orders?: WorkOrderSummary[];
}

const emptyForm: CustomerFormState = {
  type: "individual",
  firstName: "",
  lastName: "",
  companyName: "",
  contactPerson: "",
  phone: "",
  email: "",
  address: "",
  source: "",
  notes: "",
};

function syncForm(c: CustomerDetailResponse): CustomerFormState {
  return {
    type: c.type,
    firstName: c.first_name ?? "",
    lastName: c.last_name ?? "",
    companyName: c.company_name ?? "",
    contactPerson: c.contact_person ?? "",
    phone: c.phone ?? "",
    email: c.email ?? "",
    address: c.address ?? "",
    source: "",
    notes: c.notes ?? "",
  };
}

function getDisplayName(c: CustomerDetailResponse) {
  if (c.type === "company") {
    return c.company_name || c.contact_person || "Unnamed company";
  }
  return (
    [c.first_name, c.last_name].filter(Boolean).join(" ") ||
    c.full_name ||
    c.phone ||
    "Unnamed customer"
  );
}

function formatDate(v: string | null) {
  return v ? new Date(v).toLocaleDateString() : "—";
}

interface CustomerDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string | null;
}

export function CustomerDetailSheet({
  open,
  onOpenChange,
  customerId,
}: CustomerDetailSheetProps) {
  const t = useTranslations("customers");
  const commonT = useTranslations("common");
  const orgQuery = useCurrentOrg();
  const orgId = orgQuery.data?.orgId;
  const queryClient = useQueryClient();
  const { setDetailVehicleId } = usePageHeader();

  const {
    data: customer,
    isLoading: loading,
    error: queryError,
  } = useQuery({
    queryKey: customerKeys.detail(orgId ?? "", customerId ?? ""),
    queryFn: async () => {
      const res = await fetch(
        `/api/organizations/${orgId}/customers/${customerId}`,
      );
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return json.data as CustomerDetailResponse;
    },
    enabled: !!orgId && !!customerId && open,
    staleTime: 30_000,
  });

  const error = queryError ? queryError.message : null;

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<CustomerFormState>(emptyForm);

  useEffect(() => {
    if (customer && open) {
      setForm(syncForm(customer));
      setEditing(false);
    }
  }, [customer, open]);

  const handleOpenChange = useCallback(
    (value: boolean) => {
      if (!value) setEditing(false);
      onOpenChange(value);
    },
    [onOpenChange],
  );

  const editMutation = useMutation({
    mutationFn: async (formData: CustomerFormState) => {
      const res = await fetch(
        `/api/organizations/${orgId}/customers/${customerId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        },
      );
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return json.data;
    },
    onMutate: async (formData) => {
      await queryClient.cancelQueries({
        queryKey: customerKeys.detail(orgId ?? "", customerId ?? ""),
      });
      const previous = queryClient.getQueryData<CustomerDetailResponse>(
        customerKeys.detail(orgId ?? "", customerId ?? ""),
      );
      queryClient.setQueryData<CustomerDetailResponse>(
        customerKeys.detail(orgId ?? "", customerId ?? ""),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            first_name: formData.firstName || old.first_name,
            last_name: formData.lastName || old.last_name,
            company_name: formData.companyName || old.company_name,
            contact_person: formData.contactPerson || old.contact_person,
            phone: formData.phone || old.phone,
            email: formData.email || old.email,
            address: formData.address || old.address,
            notes: formData.notes || old.notes,
            type: formData.type,
          };
        },
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          customerKeys.detail(orgId ?? "", customerId ?? ""),
          context.previous,
        );
      }
      toast.error(t("failedToSave"));
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: customerKeys.all(orgId ?? ""),
      });
      setEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(
        `/api/organizations/${orgId}/customers/${customerId}`,
        { method: "DELETE" },
      );
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return json.data;
    },
    onSettled: () => {
      toast.dismiss();
      toast.success(t("deleted"));
      handleOpenChange(false);
    },
  });

  const handleSave = () => {
    if (!customerId) return;
    editMutation.mutate(form);
  };

  const isLoadingData = loading || (open && !customer && !error);
  const notFound = open && !loading && !customer && !error;

  return (
    <DetailSheet open={open} onOpenChange={handleOpenChange} size="2xl">
      <SheetHeader className="px-4 py-3 border-b border-border shrink-0">
        <DetailSheetHeader
          icon={customer?.type === "company" ? Building2 : Pencil}
          iconLoading={isLoadingData}
          title={
            <SheetTitle className="text-base truncate">
              {isLoadingData
                ? "Loading…"
                : customer
                  ? getDisplayName(customer)
                  : t("customerNotFound")}
            </SheetTitle>
          }
          subtitle={
            customer ? (
              <span className="text-xs text-muted-foreground">
                {customer.phone || "—"}
              </span>
            ) : undefined
          }
          actions={
            customer && !editing ? (
              <>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => {
                    setForm(syncForm(customer));
                    setEditing(true);
                  }}
                >
                  <Pencil className="size-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="text-destructive"
                      />
                    }
                  >
                    <Trash2 className="size-4" />
                  </AlertDialogTrigger>
                  <AlertDialogContent zLayer={1}>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t("deleteConfirm")}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t("deleteConfirm")}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{commonT("cancel")}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteMutation.mutate()}
                      >
                        {commonT("delete")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            ) : undefined
          }
        />
      </SheetHeader>

      {isLoadingData && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {(error || notFound) && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 px-4">
          <Typography.Muted className="text-sm">
            {error || "Customer not found"}
          </Typography.Muted>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenChange(false)}
          >
            {commonT("cancel")}
          </Button>
        </div>
      )}

      {!isLoadingData && !error && !notFound && customer && (
        <div className="flex-1 overflow-y-auto min-h-0 flex flex-col">
          {/* Contact info — read-only */}
          {!editing && (
            <div className="px-4 py-3 border-b border-border/50">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Contact
              </span>
              <div className="mt-2 grid gap-2 grid-cols-2">
                <InfoRow
                  icon={Phone}
                  label={t("phone")}
                  value={customer.phone}
                />
                <InfoRow
                  icon={Mail}
                  label={t("email")}
                  value={customer.email}
                />
                <InfoRow
                  icon={MapPin}
                  label={t("address")}
                  value={customer.address}
                  className="col-span-2"
                />
                {customer.type === "company" && (
                  <InfoRow
                    icon={Building2}
                    label="Company"
                    value={customer.company_name}
                    className="col-span-2"
                  />
                )}
                {customer.contact_person && (
                  <InfoRow
                    icon={Phone}
                    label={t("contactPerson")}
                    value={customer.contact_person}
                  />
                )}
              </div>
              {customer.notes && (
                <div className="mt-2 rounded-lg bg-muted/50 px-3 py-2">
                  <div className="text-xs text-muted-foreground">
                    {t("notes")}
                  </div>
                  <div className="text-sm whitespace-pre-wrap">
                    {customer.notes}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Edit mode */}
          {editing && (
            <form
              id="customer-detail-form"
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
              className="px-4 py-3 border-b border-border/50"
            >
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t("details")}
              </span>
              <div className="mt-2">
                <CustomerEditForm form={form} setForm={setForm} t={t} />
              </div>
            </form>
          )}

          {/* Vehicles */}
          {customer.vehicles.length > 0 && (
            <div className="px-4 py-3 border-b border-border/50">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Vehicles ({customer.vehicles.length})
              </span>
              <div className="mt-2 flex flex-col gap-1.5">
                {customer.vehicles.map((v) => (
                  <Item
                    key={v.id}
                    variant="muted"
                    render={
                      <button
                        className="cursor-pointer"
                        onClick={() => {
                          handleOpenChange(false);
                          setDetailVehicleId(v.id);
                        }}
                      />
                    }
                  >
                    <ItemContent>
                      <ItemTitle>
                        {v.plate_number}
                        <span className="text-xs text-muted-foreground font-normal">
                          {[v.year, v.make, v.model].filter(Boolean).join(" ")}
                        </span>
                      </ItemTitle>
                    </ItemContent>
                  </Item>
                ))}
              </div>
            </div>
          )}

          {/* Work orders */}
          {customer.work_orders && customer.work_orders.length > 0 && (
            <div className="px-4 py-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Work Orders ({customer.work_orders.length})
              </span>
              <div className="mt-2 flex flex-col gap-1.5">
                {customer.work_orders.map((wo) => (
                  <Item
                    key={wo.id}
                    variant="muted"
                    className="justify-between py-2"
                  >
                    <ItemContent className="gap-0.5">
                      <ItemTitle>
                        <StatusBadge status={wo.status} />
                        <span className="text-xs text-muted-foreground font-normal">
                          {formatDate(wo.created_at)}
                        </span>
                      </ItemTitle>
                      <ItemDescription>
                        {wo.complaint || wo.description || "Service"}
                      </ItemDescription>
                    </ItemContent>
                    <span className="text-sm font-semibold tabular-nums shrink-0 ml-2">
                      {formatMNT(Number(wo.total))}
                    </span>
                  </Item>
                ))}
              </div>
            </div>
          )}

          {/* Footer — edit mode */}
          {editing && (
            <div className="shrink-0 border-t border-border p-4">
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    if (customer) setForm(syncForm(customer));
                    setEditing(false);
                  }}
                >
                  {commonT("cancel")}
                </Button>
                <Button
                  type="submit"
                  form="customer-detail-form"
                  className="flex-1 gap-2"
                  disabled={editMutation.isPending}
                >
                  {editMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  {editMutation.isPending ? commonT("saving") : commonT("save")}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </DetailSheet>
  );
}

/* ── Info row helper ── */

function InfoRow({
  icon: Icon,
  label,
  value,
  className = "",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | null | undefined;
  className?: string;
}) {
  if (!value) return null;
  return (
    <div className={`rounded-lg bg-muted/50 px-3 py-2 ${className}`}>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3" />
        {label}
      </div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}
