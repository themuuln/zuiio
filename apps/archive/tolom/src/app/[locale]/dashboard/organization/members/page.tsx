"use client";

import { Clock3, ShieldCheck, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ListPageShell } from "@/components/list-page-shell";
import { StatCard, StatCards } from "@/components/stat-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    <div className="px-4 pt-4 pb-6 md:px-6 pb-8">
      <ListPageShell
        title={t("title")}
        description={t("subtitle")}
        headerAction={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="rounded-full px-2.5 py-0.5">
              <ShieldCheck className="mr-1 size-3.5" />
              {t("roleLabel")}
            </Badge>
            <Badge variant="outline" className="rounded-full px-2.5 py-0.5">
              <Clock3 className="mr-1 size-3.5" />
              {t("pendingCount", { count: invites.length })}
            </Badge>
            <Button
              onClick={() => setInviteSheetOpen(true)}
              className="h-11 rounded-xl px-5"
              disabled={!orgId}
            >
              <UserPlus className="mr-2 size-4" />
              {t("inviteButton")}
            </Button>
          </div>
        }
      >
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

        <StatCards columns={3}>
          <StatCard
            label={t("members")}
            sub={t("membersDescription")}
            value={members.length}
          />
          <StatCard
            label={t("pendingInvites")}
            sub={t("pendingDescription")}
            value={invites.length}
          />
          <StatCard
            label={t("branchLabel")}
            sub={commonT("stats")}
            value={branches.length}
          />
        </StatCards>

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
      </ListPageShell>
    </div>
  );
}
