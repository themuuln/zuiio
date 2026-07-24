"use client";

import { Clock3, ShieldCheck, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { useBranches } from "@/lib/queries/use-branches";
import {
  useCancelInvite,
  useCreateInvite,
  useInvites,
  useMembers,
  useRemoveMember,
  useResendInvite,
  useRoles,
  useUpdateMember,
  useUpdateMemberRole,
} from "@/lib/queries/use-members";
import { useProfile } from "@/lib/queries/use-profile";
import { reportServerError } from "@/lib/sentry-report-server";
import type { UserProfile } from "@/lib/types";
import { EditMemberDrawer } from "./_edit-member-drawer";
import { InviteDrawer } from "./_invite-drawer";
import { MemberList } from "./_member-list";
import { PendingInvites } from "./_pending-invites";

export default function MembersPage() {
  const commonT = useTranslations("common") as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const t = useTranslations("organization.memberManagement") as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;

  const { data: profile } = useProfile();
  const orgId = profile?.organizationId ?? "";

  const [inviteSheetOpen, setInviteSheetOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<
    (UserProfile & { fullName: string | null; phone: string | null }) | null
  >(null);

  // Queries
  const membersQuery = useMembers(orgId);
  const invitesQuery = useInvites(orgId);
  const rolesQuery = useRoles(orgId);
  const branchesQuery = useBranches(orgId);

  // Mutations
  const createInvite = useCreateInvite(orgId);
  const updateRole = useUpdateMemberRole(orgId);
  const updateMember = useUpdateMember(orgId);
  const cancelInvite = useCancelInvite(orgId);
  const resendInvite = useResendInvite(orgId);
  const removeMemberMutation = useRemoveMember(orgId);

  const members = membersQuery.data ?? [];
  const roles = rolesQuery.data ?? [];
  const branches = branchesQuery.data ?? [];
  const invites = useMemo(
    () =>
      (invitesQuery.data ?? []).filter((invite) => invite.status === "pending"),
    [invitesQuery.data],
  );

  const loadingMembers = membersQuery.isPending;
  const loadingInvites = invitesQuery.isPending;
  const pageError =
    (membersQuery.error instanceof Error ? membersQuery.error.message : null) ??
    (rolesQuery.error instanceof Error ? rolesQuery.error.message : null) ??
    (branchesQuery.error instanceof Error ? branchesQuery.error.message : null);
  const invitePanelError =
    invitesQuery.error instanceof Error ? invitesQuery.error.message : null;

  const handleInvite = async (data: { email: string; roleId: string }) => {
    if (!data.email.trim()) return;
    await createInvite.mutateAsync({
      email: data.email.trim(),
      roleId: data.roleId || undefined,
    });
    setInviteSheetOpen(false);
  };

  const handleRoleChange = async (userId: string, roleId: string) => {
    await updateRole.mutateAsync({ userId, roleId });
  };

  const handleSaveMember = async (
    memberId: string,
    data: {
      fullName?: string;
      phone?: string;
      roleId: string;
      branchId?: string;
    },
  ) => {
    await updateMember.mutateAsync({
      userId: memberId,
      fullName: data.fullName,
      phone: data.phone,
      roleId: data.roleId,
      branchId: data.branchId,
    });
    setEditingMember(null);
  };

  const handleCancelInvite = async (inviteId: string) => {
    await cancelInvite.mutateAsync({ inviteId });
  };

  const handleResendInvite = async (inviteId: string) => {
    await resendInvite.mutateAsync({ inviteId });
  };

  const copyInviteLink = async (token: string) => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/invite/${token}`,
      );
      toast.success(t("linkCopied"));
    } catch (error) {
      reportServerError("Unexpected error", error);
      toast.error(t("copyFailed"));
    }
  };

  const removeMember = async (userId: string) => {
    await removeMemberMutation.mutateAsync({ userId });
  };

  return (
    <div className="px-4 pt-4 pb-6 md:px-6 flex flex-col gap-6 pb-8">
      <div className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="rounded-full px-2.5 py-0.5">
                <ShieldCheck className="mr-1 size-3.5" />
                {t("roleLabel")}
              </Badge>
              <Badge variant="outline" className="rounded-full px-2.5 py-0.5">
                <Clock3 className="mr-1 size-3.5" />
                {t("pendingCount", { count: invites.length })}
              </Badge>
            </div>
            <div>
              <Typography.H1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                {t("title")}
              </Typography.H1>
              <Typography.Muted className="mt-1 max-w-2xl text-sm text-muted-foreground">
                {t("subtitle")}
              </Typography.Muted>
            </div>
          </div>
          <Button
            onClick={() => setInviteSheetOpen(true)}
            className="h-11 rounded-xl px-5"
            disabled={!orgId}
          >
            <UserPlus className="mr-2 size-4" />
            {t("inviteButton")}
          </Button>
        </div>
      </div>

      <InviteDrawer
        open={inviteSheetOpen}
        onOpenChange={setInviteSheetOpen}
        sending={createInvite.isPending}
        onSubmit={handleInvite}
        roles={roles}
        defaultRoleId={roles[0]?.id ?? ""}
        t={t}
      />

      {(pageError || invitePanelError) && (
        <Alert variant="destructive">
          <AlertTitle>{commonT("somethingWentWrong")}</AlertTitle>
          <AlertDescription>{pageError ?? invitePanelError}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/60 bg-muted/15 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{t("members")}</CardTitle>
            <CardDescription>{t("membersDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Typography.Text className="text-3xl font-semibold tabular-nums">
              {members.length}
            </Typography.Text>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-muted/15 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{t("pendingInvites")}</CardTitle>
            <CardDescription>{t("pendingDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Typography.Text className="text-3xl font-semibold tabular-nums">
              {invites.length}
            </Typography.Text>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-muted/15 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{t("branchLabel")}</CardTitle>
            <CardDescription>{commonT("stats")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Typography.Text className="text-3xl font-semibold tabular-nums">
              {branches.length}
            </Typography.Text>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.9fr)]">
        <MemberList
          loading={loadingMembers}
          members={members}
          roles={roles}
          onRoleChange={handleRoleChange}
          onEdit={setEditingMember}
          onRemove={removeMember}
          t={t}
        />

        <PendingInvites
          loading={loadingInvites}
          invites={invites}
          onCopyLink={copyInviteLink}
          onResend={handleResendInvite}
          onCancel={handleCancelInvite}
          t={t}
        />
      </div>

      {editingMember && (
        <EditMemberDrawer
          open={!!editingMember}
          onOpenChange={(open) => {
            if (!open) setEditingMember(null);
          }}
          member={editingMember}
          roles={roles}
          branches={branches}
          onSave={handleSaveMember}
          saving={updateMember.isPending}
          t={t}
        />
      )}
    </div>
  );
}
