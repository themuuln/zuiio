"use client";

import { useQuery } from "@tanstack/react-query";
import { useOrgMutation } from "@zuiio/query";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { useForm, zodResolver } from "@/lib/hooks/use-form";
import { createOrgQuery } from "@/lib/queries/factory";
import { orgKeys } from "@/lib/queries/keys";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import type { Organization, SubscriptionPlanInfo } from "@/lib/types";
import {
  OrganizationWorkspace,
  type OrgEditValues,
} from "./_organization-workspace";

const orgEditSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  logoUrl: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
});

const fetchOrgDetail = createOrgQuery<Organization>("");
const fetchSubscription = createOrgQuery<SubscriptionPlanInfo>("/subscription");

export default function OrganizationPage() {
  const t = useTranslations() as (key: string) => string;
  const orgT = useTranslations("organization") as (key: string) => string;
  const pageT = useTranslations("organization.page") as (key: string) => string;
  const currentOrg = useCurrentOrg();
  const orgId = currentOrg.data?.orgId;
  const [editing, setEditing] = useState(false);

  const organizationQuery = useQuery({
    queryKey: orgKeys.detail(orgId ?? ""),
    queryFn: () => fetchOrgDetail(orgId ?? ""),
    enabled: !!orgId,
    staleTime: 30_000,
  });
  const subscriptionQuery = useQuery({
    queryKey: orgKeys.subscription(orgId ?? ""),
    queryFn: () => fetchSubscription(orgId ?? ""),
    enabled: !!orgId,
    staleTime: 30_000,
  });

  const form = useForm<OrgEditValues>({
    resolver: zodResolver(orgEditSchema),
    defaultValues: { name: "", logoUrl: "" },
  });

  const updateOrganization = useOrgMutation<
    unknown,
    { name: string; logoUrl: string | null }
  >({
    endpoint: () => `/api/organizations/${orgId}`,
    method: "PATCH",
    queryKey: orgKeys.detail(orgId ?? ""),
    bodyFn: (values) => values,
    successMessage: pageT("orgUpdated"),
    errorMessage: pageT("failedToUpdateOrg"),
    onSuccess: () => setEditing(false),
  });

  useEffect(() => {
    if (!organizationQuery.data || editing) return;

    form.reset({
      name: organizationQuery.data.name ?? "",
      logoUrl: organizationQuery.data.logo_url ?? "",
    });
  }, [editing, form, organizationQuery.data]);

  const handleSave = async () => {
    if (!orgId) return;

    const values = form.getValues();
    await updateOrganization.mutateAsync({
      name: values.name,
      logoUrl: values.logoUrl || null,
    });
  };

  const handleCancel = () => {
    form.reset({
      name: organizationQuery.data?.name ?? "",
      logoUrl: organizationQuery.data?.logo_url ?? "",
    });
    setEditing(false);
  };

  const error =
    currentOrg.error?.message ??
    organizationQuery.error?.message ??
    subscriptionQuery.error?.message ??
    null;

  if (error && !organizationQuery.data) {
    return (
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 md:px-6 md:py-6">
        <div>
          <Typography.H1 className="text-2xl font-semibold tracking-tight">
            {orgT("organization")}
          </Typography.H1>
          <Typography.Muted className="mt-1 text-sm">
            {pageT("manageYourOrg")}
          </Typography.Muted>
        </div>
        <Card className="border-destructive/50 bg-destructive/5 shadow-none">
          <CardContent className="flex flex-col items-start gap-4 py-6">
            <Typography.Text className="text-destructive">
              {error}
            </Typography.Text>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void currentOrg.refetch();
                void organizationQuery.refetch();
                void subscriptionQuery.refetch();
              }}
            >
              {t("common.retry")}
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <OrganizationWorkspace
      editing={editing}
      form={form}
      loading={currentOrg.isPending || organizationQuery.isPending}
      onCancel={handleCancel}
      onEdit={() => setEditing(true)}
      onSave={handleSave}
      orgT={orgT}
      organization={organizationQuery.data}
      pageT={pageT}
      saving={updateOrganization.isPending}
      subscription={subscriptionQuery.data}
      subscriptionLoading={subscriptionQuery.isPending}
      t={t}
    />
  );
}
