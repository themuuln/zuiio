"use client";

import { UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useReducer, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ApiResponse, UserProfile } from "@/lib/types";
import { InviteForm } from "./_invite-form";
import { MemberList } from "./_member-list";
import { PendingInvites } from "./_pending-invites";
import type { InviteWithEmail } from "./types";

// ── Page data state (useReducer to batch related loading/data updates) ──

interface PageDataState {
  loadingMembers: boolean;
  loadingInvites: boolean;
  members: UserProfile[];
  invites: InviteWithEmail[];
}

type PageDataAction =
  | { type: "SET_LOADING_MEMBERS"; value: boolean }
  | { type: "SET_LOADING_INVITES"; value: boolean }
  | { type: "SET_MEMBERS"; members: UserProfile[] }
  | { type: "SET_INVITES"; invites: InviteWithEmail[] };

function pageDataReducer(
  state: PageDataState,
  action: PageDataAction,
): PageDataState {
  switch (action.type) {
    case "SET_LOADING_MEMBERS":
      return { ...state, loadingMembers: action.value };
    case "SET_LOADING_INVITES":
      return { ...state, loadingInvites: action.value };
    case "SET_MEMBERS":
      return { ...state, members: action.members };
    case "SET_INVITES":
      return { ...state, invites: action.invites };
  }
}

export default function MembersPage() {
  const t = useTranslations("organization.members");
  const [pageData, dispatchPageData] = useReducer(pageDataReducer, {
    loadingMembers: true,
    loadingInvites: true,
    members: [],
    invites: [],
  } satisfies PageDataState);
  const { loadingMembers, loadingInvites, members, invites } = pageData;
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
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

  useEffect(() => {
    loadMembers();
    loadInvites();
  }, [loadMembers, loadInvites]);

  const getOrgIdFromProfile = async (): Promise<string> => {
    const profileRes = await fetch("/api/profile");
    const profile = await profileRes.json();
    return profile.organizationId ?? profile.data?.organizationId ?? "";
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setSending(true);
    try {
      const orgId = await getOrgIdFromProfile();
      const res = await fetch(`/api/organizations/${orgId}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });

      const body = (await res.json()) as ApiResponse<unknown>;
      if (!res.ok || body.error) {
        throw new Error(body.error?.message ?? "Failed to create invite");
      }

      toast.success(t("inviteSent"));
      setInviteEmail("");
      setShowInviteForm(false);
      loadInvites();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to invite user");
    } finally {
      setSending(false);
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

  const pendingInvites = invites.filter((i) => i.status === "pending");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button onClick={() => setShowInviteForm(true)}>
          <UserPlus className="mr-2 size-4" />
          {t("inviteButton")}
        </Button>
      </div>

      {showInviteForm && (
        <InviteForm
          email={inviteEmail}
          onEmailChange={setInviteEmail}
          sending={sending}
          onSubmit={handleInvite}
          onClose={() => setShowInviteForm(false)}
          t={t}
        />
      )}

      <MemberList
        loading={loadingMembers}
        members={members}
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
