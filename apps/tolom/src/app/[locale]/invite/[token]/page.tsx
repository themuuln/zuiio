"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle, Loader2, LogIn, Wrench, XCircle } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import { useProfile } from "@/lib/queries/use-profile";

interface InviteData {
  id: string;
  organization_id: string;
  email: string;
  role_id: string | null;
  token: string;
  status: string;
  invited_by: string | null;
  expires_at: string;
  organization_name: string;
  inviter_name: string | null;
}

type PageState =
  | { type: "loading" }
  | { type: "loaded"; invite: InviteData; isAuthenticated: boolean }
  | { type: "error"; message: string };

export default function InviteRedeemPage() {
  const t = useTranslations("invite");
  const appT = useTranslations("app");
  const params = useParams();
  const { push } = useRouter();
  const token = params.token as string;
  const [accepted, setAccepted] = useState(false);

  const inviteQuery = useQuery({
    queryKey: ["invite", token],
    queryFn: async () => {
      const res = await fetch(`/api/invites/${token}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(
          (body as { error?: { message?: string } })?.error?.message ??
            "Invite not found or expired",
        );
      }
      const body = await res.json();
      if (!body.data) throw new Error("Invite not found");
      return body.data as InviteData;
    },
    enabled: !!token,
  });

  const profileQuery = useProfile();
  const isAuthenticated = !!profileQuery.data;

  const acceptMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/invites/${token}/redeem`, {
        method: "POST",
      });
      const body = await res.json();
      if (!res.ok || !body.data) {
        throw new Error(body.error?.message ?? "Failed to accept invite");
      }
      return body.data as { organizationId: string };
    },
    onSuccess: () => {
      setAccepted(true);
      setTimeout(() => {
        push("/dashboard");
      }, 1500);
    },
  });

  const state: PageState = (() => {
    if (inviteQuery.isLoading) return { type: "loading" };
    if (inviteQuery.error || !inviteQuery.data) {
      return {
        type: "error",
        message: inviteQuery.error?.message ?? "Failed to load invite",
      };
    }
    return {
      type: "loaded",
      invite: inviteQuery.data,
      isAuthenticated,
    };
  })();

  const handleAccept = () => {
    acceptMutation.mutate();
  };

  if (state.type === "loading") {
    return (
      <div className="flex min-h-dvh items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Skeleton className="mx-auto mb-2 size-12 rounded-full" />
            <Skeleton className="mx-auto h-6 w-48" />
            <Skeleton className="mx-auto mt-2 h-4 w-32" />
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (state.type === "error") {
    return (
      <div className="flex min-h-dvh items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="size-6 text-destructive" />
            </div>
            <CardTitle>{t("invalidTitle")}</CardTitle>
            <CardDescription>{state.message}</CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button variant="outline" onClick={() => push("/auth/login")}>
              {t("backToLogin")}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const { invite } = state;

  if (accepted) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-emerald-500/10">
              <CheckCircle className="size-6 text-emerald-500" />
            </div>
            <CardTitle>{t("acceptedTitle")}</CardTitle>
            <CardDescription>
              {t("acceptedDescription", {
                organization: invite.organization_name,
              })}
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button onClick={() => push("/dashboard")}>
              {t("goToDashboard")}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-xl bg-primary shadow-sm">
            <Wrench className="size-7 text-primary-foreground" />
          </div>
          <CardTitle className="text-xl">{t("title")}</CardTitle>
          <CardDescription>
            {t("subtitle", { organization: invite.organization_name })}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="rounded-lg border bg-muted/30 p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("organization")}</span>
              <span className="font-medium">{invite.organization_name}</span>
            </div>
            {invite.inviter_name && (
              <div className="mt-2 flex items-center justify-between">
                <span className="text-muted-foreground">{t("invitedBy")}</span>
                <span className="font-medium">{invite.inviter_name}</span>
              </div>
            )}
            <div className="mt-2 flex items-center justify-between">
              <span className="text-muted-foreground">{t("email")}</span>
              <span className="font-medium">{invite.email}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-muted-foreground">{t("expires")}</span>
              <span className="font-medium">
                {new Date(invite.expires_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          {acceptMutation.error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {acceptMutation.error.message}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex-col gap-3">
          {isAuthenticated ? (
            <Button
              className="w-full"
              onClick={handleAccept}
              disabled={acceptMutation.isPending}
            >
              {acceptMutation.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : null}
              {t("acceptButton")}
            </Button>
          ) : (
            <>
              <Button
                className="w-full"
                onClick={() => push(`/auth/login?redirectTo=/invite/${token}`)}
              >
                <LogIn className="mr-2 size-4" />
                {t("signInToAccept")}
              </Button>
              <Typography.Muted className="text-xs text-muted-foreground">
                {t("signInHint")}
              </Typography.Muted>
            </>
          )}
          <Typography.Muted className="text-xs text-muted-foreground">
            {appT("name")} &middot; {appT("tagline")}
          </Typography.Muted>
        </CardFooter>
      </Card>
    </div>
  );
}
