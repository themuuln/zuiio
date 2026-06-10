"use client";

import { UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RecentList } from "@/components/sidebar-tabs/recent-list";
import { StatusSummary } from "@/components/sidebar-tabs/status-summary";
import { Button } from "@/components/ui/button";
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
  const t = useTranslations("organization.members");
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const orgId = profile?.organizationId ?? "";

  const [inviteSheetOpen, setInviteSheetOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [editingMember, setEditingMember] = useState<
    (UserProfile & { fullName: string | null; phone: string | null }) | null
  >(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // ── Queries ──

  const { data: members = [], isLoading: loadingMembers } = useQuery<
    UserProfile[]
  >({
    queryKey: ["organizations", orgId, "members"],
    queryFn: async () => {
      const res = await fetch(`/api/organizations/${orgId}/users`);
      const body = (await res.json()) as ApiResponse<UserProfile[]>;
      return body.data ?? [];
    },
    enabled: !!orgId,
  });

  const { data: allInvites = [], isLoading: loadingInvites } = useQuery<
    InviteWithEmail[]
  >({
    queryKey: ["organizations", orgId, "invites"],
    queryFn: async () => {
      const res = await fetch(`/api/organizations/${orgId}/invites`);
      const body = (await res.json()) as ApiResponse<InviteWithEmail[]>;
      return body.data ?? [];
    },
    enabled: !!orgId,
  });

  const { data: roles = [] } = useQuery<Role[]>({
    queryKey: ["organizations", orgId, "roles"],
    queryFn: async () => {
      const res = await fetch(`/api/organizations/${orgId}/roles`);
      const body = (await res.json()) as ApiResponse<Role[]>;
      return body.data ?? [];
    },
    enabled: !!orgId,
  });

  const { data: branches = [] } = useQuery<Branch[]>({
    queryKey: ["organizations", orgId, "branches"],
    queryFn: async () => {
      const res = await fetch(`/api/organizations/${orgId}/branches`);
      const body = (await res.json()) as ApiResponse<Branch[]>;
      return body.data ?? [];
    },
    enabled: !!orgId,
  });

  const invites = useMemo(
    () => allInvites.filter((i) => i.status === "pending"),
    [allInvites],
  );

  // ── Mutations ──

  const invalidateMembers = () => {
    queryClient.invalidateQueries({
      queryKey: ["organizations", orgId, "members"],
    });
    queryClient.invalidateQueries({
      queryKey: ["organizations", orgId, "invites"],
    });
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
      invalidateMembers();
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
      if (!res.ok) {
        const body = (await res.json()) as ApiResponse<unknown>;
        throw new Error(body.error?.message ?? "Failed to update role");
      }
      toast.success(t("roleUpdated"));
      invalidateMembers();
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
      if (!res.ok) {
        const body = (await res.json()) as ApiResponse<unknown>;
        throw new Error(body.error?.message ?? "Failed to update member");
      }
      toast.success(t("saved"));
      setEditingMember(null);
      invalidateMembers();
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
      if (!res.ok) {
        const body = (await res.json()) as ApiResponse<unknown>;
        throw new Error(body.error?.message ?? "Failed to cancel invite");
      }
      toast.success(t("inviteCancelled"));
      invalidateMembers();
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
      if (!res.ok) {
        const body = (await res.json()) as ApiResponse<unknown>;
        throw new Error(body.error?.message ?? "Failed to resend invite");
      }
      toast.success(t("inviteResent"));
      invalidateMembers();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to resend invite",
      );
    }
  };

  const copyInviteLink = (token: string) => {
    const link = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(link);
    toast.success(t("linkCopied"));
  };

  const removeMember = async (userId: string) => {
    try {
      const res = await fetch(`/api/organizations/${orgId}/users`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        const body = (await res.json()) as ApiResponse<unknown>;
        throw new Error(body.error?.message ?? "Failed to remove member");
      }
      toast.success(t("memberRemoved"));
      invalidateMembers();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to remove member",
      );
    }
  };

  // ── Sidebar ──

  const { registerTab, unregisterTab } = useRightSidebar();

  const roleCounts = useMemo(() => {
    return members.reduce<Record<string, number>>((acc, m) => {
      const role = m.roleName ?? "Unassigned";
      acc[role] = (acc[role] ?? 0) + 1;
      return acc;
    }, {});
  }, [members]);

  const pendingInviteItems = useMemo(
    () =>
      invites.map((i) => ({
        id: i.id,
        primary: i.email,
        secondary: i.message ?? undefined,
        timestamp: i.created_at
          ? new Date(i.created_at).toLocaleDateString()
          : undefined,
      })),
    [invites],
  );

  // Register sidebar tabs
  useMemo(() => {
    registerTab(
      "roles",
      "Roles",
      <StatusSummary
        title="Members by role"
        items={Object.entries(roleCounts).map(([label, count]) => ({
          label,
          count,
        }))}
      />,
    );
    registerTab(
      "pending",
      "Pending",
      <RecentList
        title="Pending invites"
        items={pendingInviteItems}
        loading={loadingInvites}
        emptyMessage="No pending invites"
      />,
    );
    return () => {
      unregisterTab("roles");
      unregisterTab("pending");
    };
  }, [
    roleCounts,
    pendingInviteItems,
    loadingInvites,
    registerTab,
    unregisterTab,
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <Typography.H1 className="text-2xl font-semibold tracking-tight">
            {t("title")}
          </Typography.H1>
          <Typography.Muted className="text-muted-foreground">
            {t("subtitle")}
          </Typography.Muted>
        </div>
        <Button onClick={() => setInviteSheetOpen(true)}>
          <UserPlus className="mr-2 size-4" />
          {t("inviteButton")}
        </Button>
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
