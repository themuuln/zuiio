"use client";

import { UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ApiResponse, UserProfile } from "@/lib/types";
import { InviteForm } from "./_invite-form";
import { MemberList } from "./_member-list";
import { PendingInvites } from "./_pending-invites";
import type { InviteWithEmail } from "./types";
import { useRightSidebar } from "@/hooks/use-right-sidebar";
import { StatusSummary } from "@/components/sidebar-tabs/status-summary";
import { RecentList } from "@/components/sidebar-tabs/recent-list";
import { Typography } from "@/components/ui/typography";

// ── Page data state (useReducer to batch related loading/data updates) ──

interface Role {
  id: string;
  name: string;
}

interface PageDataState {
  loadingMembers: boolean;
  loadingInvites: boolean;
  loadingRoles: boolean;
  members: UserProfile[];
  invites: InviteWithEmail[];
  roles: Role[];
}

type PageDataAction =
  | { type: "SET_LOADING_MEMBERS"; value: boolean }
  | { type: "SET_LOADING_INVITES"; value: boolean }
  | { type: "SET_LOADING_ROLES"; value: boolean }
  | { type: "SET_MEMBERS"; members: UserProfile[] }
  | { type: "SET_INVITES"; invites: InviteWithEmail[] }
  | { type: "SET_ROLES"; roles: Role[] };

function pageDataReducer(
  state: PageDataState,
  action: PageDataAction,
): PageDataState {
  switch (action.type) {
    case "SET_LOADING_MEMBERS":
      return { ...state, loadingMembers: action.value };
    case "SET_LOADING_INVITES":
      return { ...state, loadingInvites: action.value };
    case "SET_LOADING_ROLES":
      return { ...state, loadingRoles: action.value };
    case "SET_MEMBERS":
      return { ...state, members: action.members };
    case "SET_INVITES":
      return { ...state, invites: action.invites };
    case "SET_ROLES":
      return { ...state, roles: action.roles };
  }
}

export default function MembersPage() {
  const t = useTranslations("organization.members");
  const [pageData, dispatchPageData] = useReducer(pageDataReducer, {
    loadingMembers: true,
    loadingInvites: true,
    loadingRoles: true,
    members: [],
    invites: [],
    roles: [],
  } satisfies PageDataState);
  const {
    loadingMembers,
    loadingInvites,
    loadingRoles,
    members,
    invites,
    roles,
  } = pageData;
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [sending, setSending] = useState(false);

  const loadMembers = useCallback(async () => {
    dispatchPageData({ type: "SET_LOADING_MEMBERS", value: true });
    try {
      const profileRes = await fetch("/api/profile");
      const profile = (await profileRes.json()) as {
        organizationId?: string;
        data?: { organizationId: string };
      };
      const orgId =
        profile.organizationId ?? profile.data?.organizationId ?? "";

      if (!orgId) {
        dispatchPageData({ type: "SET_MEMBERS", members: [] });
        return;
      }

      const res = await fetch(`/api/organizations/${orgId}/users`);
      const body = (await res.json()) as ApiResponse<UserProfile[]>;
      if (body.data)
        dispatchPageData({ type: "SET_MEMBERS", members: body.data });
    } catch {
      toast.error("Failed to load members");
    } finally {
      dispatchPageData({ type: "SET_LOADING_MEMBERS", value: false });
    }
  }, []);

  const loadInvites = useCallback(async () => {
    dispatchPageData({ type: "SET_LOADING_INVITES", value: true });
    try {
      const profileRes = await fetch("/api/profile");
      const profile = await profileRes.json();
      const orgId =
        profile.organizationId ?? profile.data?.organizationId ?? "";

      if (!orgId) {
        dispatchPageData({ type: "SET_INVITES", invites: [] });
        return;
      }

      const res = await fetch(`/api/organizations/${orgId}/invites`);
      const body = (await res.json()) as ApiResponse<InviteWithEmail[]>;
      if (body.data)
        dispatchPageData({
          type: "SET_INVITES",
          invites: body.data.filter((i) => i.status === "pending"),
        });
    } catch {
      toast.error("Failed to load invites");
    } finally {
      dispatchPageData({ type: "SET_LOADING_INVITES", value: false });
    }
  }, []);

  const loadRoles = useCallback(async () => {
    dispatchPageData({ type: "SET_LOADING_ROLES", value: true });
    try {
      const profileRes = await fetch("/api/profile");
      const profile = await profileRes.json();
      const orgId =
        profile.organizationId ?? profile.data?.organizationId ?? "";
      if (!orgId) {
        dispatchPageData({ type: "SET_ROLES", roles: [] });
        return;
      }
      const res = await fetch(`/api/organizations/${orgId}/roles`);
      const body = (await res.json()) as ApiResponse<Role[]>;
      if (body.data) {
        dispatchPageData({ type: "SET_ROLES", roles: body.data });
        // Default to first non-admin role, fallback to first role
        const defaultRole =
          body.data.find((r) => r.name === "Mechanic") ?? body.data[0];
        if (defaultRole) {
          dispatchPageData({ type: "SET_ROLES", roles: body.data });
        }
      }
    } catch {
      toast.error("Failed to load roles");
    } finally {
      dispatchPageData({ type: "SET_LOADING_ROLES", value: false });
    }
  }, []);

  useEffect(() => {
    loadMembers();
    loadInvites();
    loadRoles();
  }, [loadMembers, loadInvites, loadRoles]);

  const getOrgIdFromProfile = async (): Promise<string> => {
    const profileRes = await fetch("/api/profile");
    const profile = await profileRes.json();
    return profile.organizationId ?? profile.data?.organizationId ?? "";
  };

  const handleInvite = async (data: { email: string; roleId: string }) => {
    if (!data.email.trim()) return;

    setSending(true);
    try {
      const orgId = await getOrgIdFromProfile();
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
      setShowInviteForm(false);
      loadInvites();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to invite user");
    } finally {
      setSending(false);
    }
  };

  const handleRoleChange = async (userId: string, roleId: string) => {
    try {
      const orgId = await getOrgIdFromProfile();
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
      loadMembers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update role");
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    try {
      const orgId = await getOrgIdFromProfile();
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
      loadInvites();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to cancel invite",
      );
    }
  };

  const handleResendInvite = async (inviteId: string) => {
    try {
      const orgId = await getOrgIdFromProfile();
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
      loadInvites();
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
      const orgId = await getOrgIdFromProfile();
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
      loadMembers();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to remove member",
      );
    }
  };

  const pendingInvites = useMemo(
    () => invites.filter((i) => i.status === "pending"),
    [invites],
  );

  const { registerTab, unregisterTab } = useRightSidebar();

  useEffect(() => {
    const roleCounts = members.reduce<Record<string, number>>((acc, m) => {
      const role = m.roleName ?? "Unassigned";
      acc[role] = (acc[role] ?? 0) + 1;
      return acc;
    }, {});
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
        items={pendingInvites.map((i) => ({
          id: i.id,
          primary: i.email,
          secondary: i.message ?? undefined,
          timestamp: i.created_at
            ? new Date(i.created_at).toLocaleDateString()
            : undefined,
        }))}
        loading={loadingInvites}
        emptyMessage="No pending invites"
      />,
    );
    return () => {
      unregisterTab("roles");
      unregisterTab("pending");
    };
  }, [loadingInvites, members, pendingInvites, registerTab, unregisterTab]);

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
        <Button onClick={() => setShowInviteForm(true)}>
          <UserPlus className="mr-2 size-4" />
          {t("inviteButton")}
        </Button>
      </div>

      {showInviteForm && (
        <InviteForm
          sending={sending}
          onSubmit={handleInvite}
          onClose={() => setShowInviteForm(false)}
          roles={roles}
          defaultRoleId={roles[0]?.id ?? ""}
          t={t}
        />
      )}

      <MemberList
        loading={loadingMembers}
        members={members}
        roles={roles}
        onRoleChange={handleRoleChange}
        onRemove={removeMember}
        t={t}
      />

      <PendingInvites
        loading={loadingInvites}
        invites={pendingInvites}
        onCopyLink={copyInviteLink}
        onResend={handleResendInvite}
        onCancel={handleCancelInvite}
        t={t}
      />
    </div>
  );
}
