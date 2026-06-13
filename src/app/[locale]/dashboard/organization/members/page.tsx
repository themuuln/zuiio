"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock3, ShieldCheck, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { RecentList } from "@/components/sidebar-tabs/recent-list";
import { StatusSummary } from "@/components/sidebar-tabs/status-summary";
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
import { useRightSidebar } from "@/hooks/use-right-sidebar";
import { useProfile } from "@/lib/queries/use-profile";
import type { ApiResponse, UserProfile } from "@/lib/types";
import { EditMemberSheet } from "./_edit-member-sheet";
import { InviteSheet } from "./_invite-sheet";
import { MemberList } from "./_member-list";
import { PendingInvites } from "./_pending-invites";
import type { InviteWithEmail } from "./types";

interface Role {
  id: string;
  name: string;
}

interface Branch {
  id: string;
  name: string;
}

export default function MembersPage() {
  const commonT = useTranslations("common");
  const t = useTranslations("organization.memberManagement");
  const queryClient = useQueryClient();
  const { registerTab, unregisterTab } = useRightSidebar();
  const { data: profile } = useProfile();
  const orgId = profile?.organizationId ?? "";

  const [inviteSheetOpen, setInviteSheetOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editingMember, setEditingMember] = useState<
    (UserProfile & { fullName: string | null; phone: string | null }) | null
  >(null);

  const membersQuery = useQuery<UserProfile[]>({
    queryKey: ["organizations", orgId, "members"],
    queryFn: async () => {
      const res = await fetch(`/api/organizations/${orgId}/users`);
      const body = (await res.json()) as ApiResponse<UserProfile[]>;
      if (!res.ok || body.error) {
        throw new Error(body.error?.message ?? "Failed to load members");
      }
      return body.data ?? [];
    },
    enabled: !!orgId,
  });

  const invitesQuery = useQuery<InviteWithEmail[]>({
    queryKey: ["organizations", orgId, "invites"],
    queryFn: async () => {
      const res = await fetch(`/api/organizations/${orgId}/invites`);
      const body = (await res.json()) as ApiResponse<InviteWithEmail[]>;
      if (!res.ok || body.error) {
        throw new Error(body.error?.message ?? "Failed to load invites");
      }
      return body.data ?? [];
    },
    enabled: !!orgId,
  });

  const rolesQuery = useQuery<Role[]>({
    queryKey: ["organizations", orgId, "roles"],
    queryFn: async () => {
      const res = await fetch(`/api/organizations/${orgId}/roles`);
      const body = (await res.json()) as ApiResponse<Role[]>;
      if (!res.ok || body.error) {
        throw new Error(body.error?.message ?? "Failed to load roles");
      }
      return body.data ?? [];
    },
    enabled: !!orgId,
  });

  const branchesQuery = useQuery<Branch[]>({
    queryKey: ["organizations", orgId, "branches"],
    queryFn: async () => {
      const res = await fetch(`/api/organizations/${orgId}/branches`);
      const body = (await res.json()) as ApiResponse<Branch[]>;
      if (!res.ok || body.error) {
        throw new Error(body.error?.message ?? "Failed to load branches");
      }
      return body.data ?? [];
    },
    enabled: !!orgId,
  });

  const members = membersQuery.data ?? [];
  const _allInvites = invitesQuery.data ?? [];
  const roles = rolesQuery.data ?? [];
  const branches = branchesQuery.data ?? [];
  const invites = useMemo(
    () =>
      (invitesQuery.data ?? []).filter((invite) => invite.status === "pending"),
    [invitesQuery.data],
  );

  const loadingMembers = membersQuery.isLoading;
  const loadingInvites = invitesQuery.isLoading;
  const pageError =
    (membersQuery.error instanceof Error ? membersQuery.error.message : null) ??
    (rolesQuery.error instanceof Error ? rolesQuery.error.message : null) ??
    (branchesQuery.error instanceof Error ? branchesQuery.error.message : null);
  const invitePanelError =
    invitesQuery.error instanceof Error ? invitesQuery.error.message : null;

  const invalidateMembers = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["organizations", orgId, "members"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["organizations", orgId, "invites"],
      }),
    ]);
  };

  const handleInvite = async (data: { email: string; roleId: string }) => {
    if (!data.email.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/organizations/${orgId}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email.trim(),
          roleId: data.roleId || undefined,
        }),
      });
      const body = (await res.json()) as ApiResponse<unknown>;
      if (!res.ok || body.error) {
        throw new Error(body.error?.message ?? "Failed to create invite");
      }
      toast.success(t("inviteSent"));
      setInviteSheetOpen(false);
      await invalidateMembers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to invite user");
    } finally {
      setSending(false);
    }
  };

  const handleRoleChange = async (userId: string, roleId: string) => {
    try {
      const res = await fetch(`/api/organizations/${orgId}/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId }),
      });
      const body = (await res.json()) as ApiResponse<unknown>;
      if (!res.ok || body.error) {
        throw new Error(body.error?.message ?? "Failed to update role");
      }
      toast.success(t("roleUpdated"));
      await invalidateMembers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update role");
    }
  };

  const handleSaveMember = async (
    memberId: string,
    data: { fullName: string; phone: string; roleId: string; branchId: string },
  ) => {
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/organizations/${orgId}/users/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: data.fullName || null,
          phone: data.phone || null,
          roleId: data.roleId,
          branchId: data.branchId || null,
        }),
      });
      const body = (await res.json()) as ApiResponse<unknown>;
      if (!res.ok || body.error) {
        throw new Error(body.error?.message ?? "Failed to update member");
      }
      toast.success(t("saved"));
      setEditingMember(null);
      await invalidateMembers();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update member",
      );
    } finally {
      setSavingEdit(false);
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    try {
      const res = await fetch(`/api/organizations/${orgId}/invites`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId }),
      });
      const body = (await res.json()) as ApiResponse<unknown>;
      if (!res.ok || body.error) {
        throw new Error(body.error?.message ?? "Failed to cancel invite");
      }
      toast.success(t("inviteCancelled"));
      await invalidateMembers();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to cancel invite",
      );
    }
  };

  const handleResendInvite = async (inviteId: string) => {
    try {
      const res = await fetch(`/api/organizations/${orgId}/invites`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId, action: "resend" }),
      });
      const body = (await res.json()) as ApiResponse<unknown>;
      if (!res.ok || body.error) {
        throw new Error(body.error?.message ?? "Failed to resend invite");
      }
      toast.success(t("inviteResent"));
      await invalidateMembers();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to resend invite",
      );
    }
  };

  const copyInviteLink = async (token: string) => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/invite/${token}`,
      );
      toast.success(t("linkCopied"));
    } catch {
      toast.error(t("copyFailed"));
    }
  };

  const removeMember = async (userId: string) => {
    try {
      const res = await fetch(`/api/organizations/${orgId}/users`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const body = (await res.json()) as ApiResponse<unknown>;
      if (!res.ok || body.error) {
        throw new Error(body.error?.message ?? "Failed to remove member");
      }
      toast.success(t("memberRemoved"));
      await invalidateMembers();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to remove member",
      );
    }
  };

  const roleCounts = useMemo(
    () =>
      members.reduce<Record<string, number>>((acc, member) => {
        const role = member.roleName ?? t("noRole");
        acc[role] = (acc[role] ?? 0) + 1;
        return acc;
      }, {}),
    [members, t],
  );

  const pendingInviteItems = useMemo(
    () =>
      invites.map((invite) => ({
        id: invite.id,
        primary: invite.email,
        secondary: invite.message ?? undefined,
        timestamp: invite.created_at
          ? new Date(invite.created_at).toLocaleDateString()
          : undefined,
      })),
    [invites],
  );

  useEffect(() => {
    registerTab(
      "roles",
      t("roleLabel"),
      <StatusSummary
        title={t("membersDescription")}
        items={Object.entries(roleCounts).map(([label, count]) => ({
          label,
          count,
        }))}
      />,
    );
    registerTab(
      "pending",
      t("pendingInvites"),
      <RecentList
        title={t("pendingInvites")}
        items={pendingInviteItems}
        loading={loadingInvites}
        emptyMessage={t("noPendingInvites")}
      />,
    );
    return () => {
      unregisterTab("roles");
      unregisterTab("pending");
    };
  }, [
    loadingInvites,
    pendingInviteItems,
    registerTab,
    roleCounts,
    t,
    unregisterTab,
  ]);

  return (
    <div className="flex flex-col gap-6 pb-8">
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

      <InviteSheet
        open={inviteSheetOpen}
        onOpenChange={setInviteSheetOpen}
        sending={sending}
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
        <EditMemberSheet
          open={!!editingMember}
          onOpenChange={(open) => {
            if (!open) setEditingMember(null);
          }}
          member={editingMember}
          roles={roles}
          branches={branches}
          onSave={handleSaveMember}
          saving={savingEdit}
          t={t}
        />
      )}
    </div>
  );
}
