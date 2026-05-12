"use client";

import { Building2, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApiResponse, Organization } from "@/lib/types";

export default function OrganizationPage() {
  const t = useTranslations();
  const router = useRouter();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrganization = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/organizations");
      const json = (await response.json()) as ApiResponse<Organization | null>;
      if (!response.ok || json.error) {
        throw new Error(json.error?.message ?? "Failed to load organization");
      }
      if (!json.data) {
        throw new Error("No organization found");
      }
      setOrganization(json.data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load organization";
      toast.error(message);
      setError(message);
      if (message === "No organization found") {
        router.replace(
          "/auth/select-organization?returnUrl=/dashboard/organization",
        );
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadOrganization();
  }, [loadOrganization]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <Skeleton className="h-8 w-40" />
          <Skeleton className="mt-2 h-5 w-56" />
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-36" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-36" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error && !organization) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("nav.organization")}
          </h1>
          <p className="text-muted-foreground">Manage your organization</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-start gap-4 py-6">
            <p className="text-destructive">{error}</p>
            <Button onClick={() => loadOrganization()} variant="outline">
              {t("common.retry")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t("nav.organization")}
        </h1>
        <p className="text-muted-foreground">Manage your organization</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="size-4" />
              Organization
            </CardTitle>
            <CardDescription>Workspace details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{organization?.name ?? "\u2014"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Slug</p>
              <p className="font-medium">{organization?.slug ?? "\u2014"}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-4" />
              Members
            </CardTitle>
            <CardDescription>Team members in this organization</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Member management coming soon.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
