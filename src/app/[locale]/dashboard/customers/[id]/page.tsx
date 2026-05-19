"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Building2, Pencil, Save, Trash2, X } from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { toast } from "sonner";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ExportColumn } from "@/lib/export";
import { Link, useRouter } from "@/lib/i18n/navigation";
import { customerKeys } from "@/lib/queries/keys";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import type { WorkOrderStatus } from "@/lib/database.types";
import {
  CustomerEditForm,
  type CustomerFormState,
} from "./_customer-edit-form";
import type { CustomerVehicleSummary } from "./_vehicle-list-card";
import { VehicleListCard } from "./_vehicle-list-card";
import { CustomerWorkOrderHistory } from "./_customer-work-order-history";

type CustomerType = "individual" | "company";

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

function getCustomerDisplayName(customer: CustomerDetailResponse) {
  if (customer.type === "company") {
    return (
      customer.company_name || customer.contact_person || "Unnamed company"
    );
  }

  return (
    [customer.first_name, customer.last_name].filter(Boolean).join(" ") ||
    customer.full_name ||
    customer.phone ||
    "Unnamed customer"
  );
}

export default function CustomerDetailPage() {
  const t = useTranslations("customers");
  const commonT = useTranslations("common");
  const params = useParams();
  const { push } = useRouter();
  const customerId = params.id as string;

  const orgQuery = useCurrentOrg();
  const orgId = orgQuery.data?.orgId;

  const {
    data: customer,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: customerKeys.detail(orgId ?? "", customerId ?? ""),
    queryFn: async () => {
      const response = await fetch(
        `/api/organizations/${orgId}/customers/${customerId}`,
      );
      const json = await response.json();
      if (json.error) throw new Error(json.error.message);
      return json.data as CustomerDetailResponse;
    },
    enabled: !!orgId && !!customerId,
    staleTime: 30_000,
  });

  const error = queryError ? queryError.message : null;

  const vehicleExportColumns: ExportColumn<CustomerVehicleSummary>[] = [
    { key: "plate_number", label: "Plate" },
    { key: "make", label: "Make" },
    { key: "model", label: "Model" },
    { key: "year", label: "Year" },
  ];

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<CustomerFormState>(emptyForm);

  const syncForm = useCallback((nextCustomer: CustomerDetailResponse) => {
    setForm({
      type: nextCustomer.type,
      firstName: nextCustomer.first_name ?? "",
      lastName: nextCustomer.last_name ?? "",
      companyName: nextCustomer.company_name ?? "",
      contactPerson: nextCustomer.contact_person ?? "",
      phone: nextCustomer.phone ?? "",
      email: nextCustomer.email ?? "",
      address: nextCustomer.address ?? "",
      source: "",
      notes: nextCustomer.notes ?? "",
    });
  }, []);

  const handleSave = async () => {
    if (!orgId || !customerId) {
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        `/api/organizations/${orgId}/customers/${customerId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );
      const json = await response.json();

      if (json.error) {
        toast.error(json.error.message);
        return;
      }

      refetch();
      setEditing(false);
      toast.success("Customer updated");
    } catch {
      toast.error(t("failedToSave"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!orgId || !customerId) return;
    try {
      const response = await fetch(
        `/api/organizations/${orgId}/customers/${customerId}`,
        { method: "DELETE" },
      );
      const json = await response.json();
      if (json.error) {
        toast.error(json.error.message);
        return;
      }
      toast.success(t("deleted"));
      push("/dashboard/customers");
    } catch {
      toast.error(t("failedToSave"));
    }
  };

  if (orgQuery.isLoading || loading) {
    return (
      <div className="flex max-w-3xl flex-col gap-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-[34rem] w-full" />
      </div>
    );
  }

  if (error && !customer) {
    return (
      <div className="flex flex-col gap-6">
        <Button
          render={<Link href="/dashboard/customers" />}
          variant="ghost"
          className="w-fit"
        >
          <ArrowLeft className="size-4" />
          {commonT("back")}
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => refetch()} variant="outline">
              {t("retry")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!customer) {
    return null;
  }

  const customerName = getCustomerDisplayName(customer);

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button
          render={<Link href="/dashboard/customers" />}
          variant="ghost"
          size="icon"
          aria-label={commonT("back")}
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">{customerName}</h1>
          <p className="text-sm text-muted-foreground">
            Added {new Date(customer.created_at).toLocaleDateString()}
          </p>
        </div>
        {!editing ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                syncForm(customer);
                setEditing(true);
              }}
            >
              <Pencil className="size-4" />
              {commonT("edit")}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger render={<Button variant="outline" className="text-destructive hover:text-destructive" />}>
                <Trash2 className="size-4" />
                {commonT("delete")}
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("deleteConfirm")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("deleteConfirm")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{commonT("cancel")}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>
                    {commonT("delete")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving}>
              <Save className="size-4" />
              {saving ? commonT("saving") : commonT("save")}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                syncForm(customer);
                setEditing(false);
              }}
            >
              <X className="size-4" />
              {commonT("cancel")}
            </Button>
          </div>
        )}
      </div>

      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("details")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {editing ? (
            <CustomerEditForm form={form} setForm={setForm} t={t} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="mb-1 text-xs text-muted-foreground">
                  {t("phone")}
                </p>
                <p className="text-sm font-medium">{customer.phone || "—"}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="mb-1 text-xs text-muted-foreground">
                  {t("email")}
                </p>
                <p className="text-sm font-medium">{customer.email || "—"}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="mb-1 text-xs text-muted-foreground">
                  {t("type")}
                </p>
                <p className="text-sm font-medium capitalize">
                  {customer.type}
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="mb-1 text-xs text-muted-foreground">
                  {t("contactPerson")}
                </p>
                <p className="text-sm font-medium">
                  {customer.contact_person || customer.first_name || "—"}
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 sm:col-span-2">
                <p className="mb-1 text-xs text-muted-foreground">
                  {t("address")}
                </p>
                <p className="text-sm font-medium">{customer.address || "—"}</p>
              </div>
              {customer.type === "company" && (
                <div className="rounded-lg bg-muted/50 p-3 sm:col-span-2">
                  <p className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <Building2 className="size-3.5" />
                    Company account
                  </p>
                  <p className="text-sm font-medium">
                    {customer.company_name || "Unnamed company"}
                  </p>
                </div>
              )}
              <div className="rounded-lg bg-muted/50 p-3 sm:col-span-2">
                <p className="mb-1 text-xs text-muted-foreground">
                  {t("notes")}
                </p>
                <p className="whitespace-pre-wrap text-sm font-medium">
                  {customer.notes || "—"}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <VehicleListCard
        vehicles={customer.vehicles}
        customerId={customer.id}
        router={router}
        vehicleExportColumns={vehicleExportColumns}
        t={t}
      />

      {customer.work_orders && (
        <CustomerWorkOrderHistory
          workOrders={customer.work_orders}
          router={router}
        />
      )}
    </div>
  );
}
