"use client";

import {
  Copy,
  Loader2,
  Mail,
  MailPlus,
  MoreHorizontal,
  RefreshCw,
  Trash2,
  UserMinus,
  UserPlus,
  Users,
  X,
} from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { OrgInvite } from "@/lib/database.types";
import type { ApiResponse, UserProfile } from "@/lib/types";

interface InviteWithEmail extends OrgInvite {
  organization_name?: string;
  inviter_name?: string | null;
}

export default function MembersPage() {
  const t = useTranslations("organization.members");
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [invites, setInvites] = useState<InviteWithEmail[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loadingInvites, setLoadingInvites] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [sending, setSending] = useState(false);

  const loadMembers = useCallback(async () => {
    setLoadingMembers(true);
    try {
      const profileRes = await fetch("/api/profile");
      const profile = (await profileRes.json()) as {
        organizationId?: string;
        data?: { organizationId: string };
      };
      const orgId =
        profile.organizationId ?? profile.data?.organizationId ?? "";

      if (!orgId) {
        setMembers([]);
        return;
      }

      const res = await fetch(`/api/organizations/${orgId}/users`);
      const body = (await res.json()) as ApiResponse<UserProfile[]>;
      if (body.data) setMembers(body.data);
    } catch {
      toast.error("Failed to load members");
    } finally {
      setLoadingMembers(false);
    }
  }, []);

  const loadInvites = useCallback(async () => {
    setLoadingInvites(true);
    try {
      const profileRes = await fetch("/api/profile");
      const profile = await profileRes.json();
      const orgId =
        profile.organizationId ?? profile.data?.organizationId ?? "";

      if (!orgId) {
        setInvites([]);
        return;
      }

      const res = await fetch(`/api/organizations/${orgId}/invites`);
      const body = (await res.json()) as ApiResponse<InviteWithEmail[]>;
      if (body.data) setInvites(body.data.filter((i) => i.status === "pending"));
    } catch {
      toast.error("Failed to load invites");
    } finally {
      setLoadingInvites(false);
    }
  }, []);

  useEffect(() => {
    loadMembers();
    loadInvites();
  }, [loadMembers, loadInvites]);

  const getOrgIdFromProfile = async (): Promise<string> => {
    const profileRes = await fetch("/api/profile");
    const profile = await profileRes.json();
    return (
      profile.organizationId ?? profile.data?.organizationId ?? ""
    );
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
      toast.error(err instanceof Error ? err.message : "Failed to cancel invite");
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
      toast.error(err instanceof Error ? err.message : "Failed to resend invite");
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
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button onClick={() => setShowInviteForm(true)}>
          <UserPlus className="mr-2 size-4" />
          {t("inviteButton")}
        </Button>
      </div>

      {/* Invite Form Dialog */}
      {showInviteForm && (
        <Card className="border-primary/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base">{t("inviteNew")}</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => setShowInviteForm(false)}
            >
              <X className="size-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="flex items-end gap-3">
              <div className="flex-1 space-y-1.5">
                <label
                  htmlFor="inviteEmail"
                  className="text-sm font-medium text-foreground"
                >
                  {t("emailLabel")}
                </label>
                <input
                  id="inviteEmail"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder={t("emailPlaceholder")}
                  required
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </div>
              <Button type="submit" disabled={sending || !inviteEmail.trim()}>
                {sending ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <MailPlus className="mr-2 size-4" />
                )}
                {t("sendInvite")}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="size-4" />
            {t("members")}
          </CardTitle>
          <CardDescription>{t("membersDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingMembers ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="size-9 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="mt-1 h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : members.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              {t("noMembers")}
            </p>
          ) : (
            <div className="divide-y">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-full bg-muted text-xs font-medium uppercase text-muted-foreground">
                      {(member.fullName ?? member.email ?? "?")
                        .slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {member.fullName ?? t("unnamed")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {member.roleName ?? t("noRole")}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <Button variant="ghost" size="icon" className="size-8">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => removeMember(member.id)}
                      >
                        <UserMinus className="mr-2 size-4" />
                        {t("removeMember")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="size-4" />
            {t("pendingInvites")}
          </CardTitle>
          <CardDescription>{t("pendingDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingInvites ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="size-9 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="mt-1 h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : pendingInvites.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              {t("noPendingInvites")}
            </p>
          ) : (
            <div className="divide-y">
              {pendingInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                      <Mail className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{invite.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {t("pending")} &middot;{" "}
                        {new Date(invite.expires_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger>
                        <button
                          type="button"
                          className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                          onClick={() => copyInviteLink(invite.token)}
                        >
                          <Copy className="size-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>{t("copyLink")}</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger>
                        <button
                          type="button"
                          className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                          onClick={() => handleResendInvite(invite.id)}
                        >
                          <RefreshCw className="size-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>{t("resendInvite")}</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger>
                        <button
                          type="button"
                          className="inline-flex size-8 items-center justify-center rounded-md text-destructive hover:bg-destructive/10"
                          onClick={() => handleCancelInvite(invite.id)}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>{t("cancelInvite")}</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
