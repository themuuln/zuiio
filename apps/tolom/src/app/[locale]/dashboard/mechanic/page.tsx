"use client";

import {
  Building2,
  DollarSign,
  MoreHorizontal,
  Shield,
  UserPlus,
  Users,
  Wrench,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { MechanicAvatar } from "@/components/mechanic-avatar";
import { MechanicSelect } from "@/components/mechanic-select";
import { NewMechanicSheet } from "@/components/new-mechanic-drawer";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import { useClientNow } from "@/hooks/use-client-now";
import { useCurrentUserRole } from "@/hooks/use-current-user-role";
import { Link } from "@/lib/i18n/navigation";
import { useMechanicsList } from "@/lib/queries/use-mechanic-dashboard";
import { MechanicDashboard } from "./_mechanic-dashboard";

export default function MechanicPage() {
  const t = useTranslations() as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const now = useClientNow();
  const {
    profile,
    loading: roleLoading,
    isMechanic,
    isAdmin,
  } = useCurrentUserRole();
  const mechanicsQuery = useMechanicsList(profile?.organizationId ?? undefined);
  const mechanics = mechanicsQuery.data ?? [];
  const mechanicsLoading = mechanicsQuery.isPending;
  const [selectedMechanicId, setSelectedMechanicId] = useState<string | null>(
    null,
  );
  const [showAddMechanic, setShowAddMechanic] = useState(false);

  useEffect(() => {
    if (mechanics.length > 0 && !selectedMechanicId) {
      setSelectedMechanicId(mechanics[0].id);
    }
  }, [mechanics, selectedMechanicId]);

  if (roleLoading) {
    return (
      <div className="px-4 pt-4 pb-6 md:px-6 tablet-touch flex flex-col gap-6">
        <div>
          <Skeleton className="h-7 w-44" />
          <Skeleton className="mt-1.5 h-4 w-56" />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={`skeleton-${i}`}
              className="rounded-xl border border-border/60 bg-card p-4"
            >
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-2 h-7 w-16" />
              <Skeleton className="mt-1 h-3 w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!isMechanic && !isAdmin && !roleLoading) {
    return (
      <div className="px-4 pt-4 pb-6 md:px-6 tablet-touch flex flex-col items-center justify-center py-20 gap-4">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/50">
          <Wrench className="size-7 text-muted-foreground" />
        </div>
        <Typography.H2 className="text-lg font-semibold">
          {t("mechanic.dashboardTitle")}
        </Typography.H2>
        <Typography.Muted className="text-sm text-muted-foreground text-center max-w-md">
          {t("mechanic.restrictedAccess")}{" "}
          <strong>{profile?.roleName ?? t("common.unknown")}</strong>.{"\n"}
          {t("mechanic.askAdmin")}
        </Typography.Muted>
      </div>
    );
  }

  if (isAdmin) {
    return (
      <div className="px-4 pt-4 pb-6 md:px-6">
        {mechanicsLoading ? (
          <div className="tablet-touch flex flex-col gap-6">
            <div>
              <Skeleton className="h-7 w-44" />
              <Skeleton className="mt-1.5 h-4 w-56" />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={`skeleton-${i}`}
                  className="rounded-xl border border-border/60 bg-card p-4"
                >
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="mt-2 h-7 w-16" />
                  <Skeleton className="mt-1 h-3 w-20" />
                </div>
              ))}
            </div>
          </div>
        ) : mechanics.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Users />
              </EmptyMedia>
              <EmptyTitle>{t("mechanic.noMechanics")}</EmptyTitle>
              <EmptyDescription>
                {t("mechanic.noMechanicsDesc")}
              </EmptyDescription>
            </EmptyHeader>
            <Button onClick={() => setShowAddMechanic(true)} className="mt-4">
              <UserPlus className="mr-2 size-4" />
              {t("mechanic.inviteMechanic")}
            </Button>
          </Empty>
        ) : selectedMechanicId ? (
          <div className="tablet-touch flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-3">
                  <MechanicAvatar
                    mechanic={
                      mechanics.find((m) => m.id === selectedMechanicId) ?? {
                        id: selectedMechanicId ?? "",
                        full_name: null,
                      }
                    }
                    className="size-10"
                  />
                  <div>
                    <Typography.H1 className="text-xl font-semibold tracking-tight">
                      {mechanics.find((m) => m.id === selectedMechanicId)
                        ?.full_name ?? t("nav.mechanic")}
                    </Typography.H1>
                    <Typography.Muted className="mt-0.5 text-xs text-muted-foreground/60">
                      {now.toLocaleDateString("mn-MN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </Typography.Muted>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="size-4 text-muted-foreground/50 shrink-0" />
                <MechanicSelect
                  value={selectedMechanicId ?? ""}
                  onChange={setSelectedMechanicId}
                  mechanics={mechanics}
                  placeholder={t("mechanic.selectMechanic")}
                  size="sm"
                  className="w-[200px]"
                />
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center justify-center size-8 rounded-md border border-border/60 hover:bg-muted/60 cursor-pointer">
                    <MoreHorizontal className="size-4 text-muted-foreground/60" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setShowAddMechanic(true)}>
                      <UserPlus className="size-4" />
                      {t("mechanic.inviteMechanic")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      render={<Link href="/dashboard/organization/members" />}
                    >
                      <Users className="size-4" />
                      {t("mechanic.members")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      render={<Link href="/dashboard/payroll" />}
                    >
                      <DollarSign className="size-4" />
                      {t("mechanic.payroll")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      render={<Link href="/dashboard/organization/roles" />}
                    >
                      <Shield className="size-4" />
                      {t("mechanic.roles")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      render={<Link href="/dashboard/organization" />}
                    >
                      <Building2 className="size-4" />
                      {t("mechanic.organization")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <MechanicDashboard
              userId={selectedMechanicId}
              orgId={profile?.organizationId ?? ""}
              mechanicName={
                mechanics.find((m) => m.id === selectedMechanicId)?.full_name
              }
              avatarUrl={
                mechanics.find((m) => m.id === selectedMechanicId)?.avatar_url
              }
              isAdminView
            />
          </div>
        ) : null}
        <NewMechanicSheet
          open={showAddMechanic}
          onOpenChange={(open) => {
            setShowAddMechanic(open);
            if (!open) mechanicsQuery.refetch();
          }}
        />
      </div>
    );
  }

  return (
    <div className="px-4 pt-4 pb-6 md:px-6">
      <MechanicDashboard
        userId={profile?.id ?? ""}
        orgId={profile?.organizationId ?? ""}
        mechanicName={profile?.fullName}
        avatarUrl={profile?.avatarUrl}
        isAdminView={false}
      />
      <NewMechanicSheet
        open={showAddMechanic}
        onOpenChange={(open) => {
          setShowAddMechanic(open);
          if (!open) mechanicsQuery.refetch();
        }}
      />
    </div>
  );
}
