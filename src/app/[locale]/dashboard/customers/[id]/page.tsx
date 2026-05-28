"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  Car,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
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
import type { WorkOrderStatus } from "@/lib/types";
import {
  CustomerEditForm,
  type CustomerFormState,
} from "./_customer-edit-form";
import type { CustomerVehicleSummary } from "./_vehicle-list-card";
import { VehicleListCard } from "./_vehicle-list-card";
import { CommunicationLog } from "./_communication-log";
import { CustomerNotes } from "./_customer-notes";
import { CustomerWorkOrderHistory } from "./_customer-work-order-history";
import { useRightSidebar } from "@/hooks/use-right-sidebar";
import { ContactCard } from "@/components/sidebar-tabs/contact-card";
import { RecentList } from "@/components/sidebar-tabs/recent-list";

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
  const router = useRouter();
  const { push } = router;
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

  const sidebar = useRightSidebar();

  const error = queryError ? queryError.message : null;

  useEffect(() => {
    if (!customer) return;

    sidebar.setActiveTab("contact");

    sidebar.registerTab(
      "contact",
      "Contact",
      <ContactCard
        items={[
          {
            label: "Phone",
            value: customer.phone,
            icon: Phone,
            copyable: true,
          },
          { label: "Email", value: customer.email, icon: Mail, copyable: true },
          { label: "Address", value: customer.address, icon: MapPin },
        ]}
      />,
      <Phone className="size-4" />,
    );

    sidebar.registerTab(
      "vehicles",
      "Vehicles",
      <RecentList
        items={customer.vehicles.map((v) => ({
          id: v.id,
          primary: v.plate_number,
          secondary: [v.year, v.make, v.model].filter(Boolean).join(" "),
          href: `/dashboard/vehicles/${v.id}`,
        }))}
        emptyMessage="No vehicles"
      />,
      <Car className="size-4" />,
    );

    return () => {
      sidebar.unregisterTab("contact");
      sidebar.unregisterTab("vehicles");
    };
  }, [customer]);

  const vehicleExportColumns: ExportColumn<CustomerVehicleSummary>[] = [
    { key: "plate_number", label: "Plate" },
    { key: "make", label: "Make" },
    { key: "model", label: "Model" },
    { key: "year", label: "Year" },
  ];

  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
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

  const editMutation = useMutation({
    mutationFn: async (formData: CustomerFormState) => {
      const response = await fetch(
        `/api/organizations/${orgId}/customers/${customerId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        },
      );
      const json = await response.json();
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
            source: formData.source || old.source,
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
      const response = await fetch(
        `/api/organizations/${orgId}/customers/${customerId}`,
        { method: "DELETE" },
      );
      const json = await response.json();
      if (json.error) throw new Error(json.error.message);
      return json.data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: customerKeys.all(orgId ?? ""),
      });
    },
    onError: (err) => {
      queryClient.invalidateQueries({
        queryKey: customerKeys.all(orgId ?? ""),
      });
      const message = err instanceof Error ? err.message : t("failedToSave");
      setSaveError(message);
      toast.error(message);
    },
    onSettled: () => {
      toast.success(t("deleted"));
      push("/dashboard/customers");
    },
  });

  const handleSave = () => {
    if (!orgId || !customerId) return;
    setSaveError(null);
    editMutation.mutate(form);
  };

  const handleDelete = () => {
    if (!orgId || !customerId) return;
    deleteMutation.mutate();
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
          size="icon-xs"
          aria-label={commonT("back")}
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {customerName}
          </h1>
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
              <AlertDialogTrigger
                render={
                  <Button
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                  />
                }
              >
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
            <Button
              type="submit"
              form="customer-edit-form"
              disabled={editMutation.isPending}
            >
              {editMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {editMutation.isPending ? commonT("saving") : commonT("save")}
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

      {(editing && saveError) || (!editing && error) ? (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4">
            <p className="text-sm text-destructive">
              {editing ? saveError : error}
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("details")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {editing ? (
            <form
              id="customer-edit-form"
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
            >
              <CustomerEditForm form={form} setForm={setForm} t={t} />
            </form>
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

      <CommunicationLog orgId={orgId} customerId={customerId} />

      <CustomerNotes orgId={orgId} customerId={customerId} />
    </div>
  );
}
