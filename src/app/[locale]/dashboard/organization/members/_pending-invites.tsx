"use client";

import { Copy, Mail, RefreshCw, Trash2 } from "lucide-react";
import type { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { InviteWithEmail } from "./types";
import { Typography } from "@/components/ui/typography";

interface PendingInvitesProps {
  loading: boolean;
  invites: InviteWithEmail[];
  onCopyLink: (token: string) => void;
  onResend: (inviteId: string) => void;
  onCancel: (inviteId: string) => void;
  t: ReturnType<typeof useTranslations<"organization.members">>;
}

export function PendingInvites({
  loading,
  invites,
  onCopyLink,
  onResend,
  onCancel,
  t,
}: PendingInvitesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Mail className="size-4" />
          {t("pendingInvites")}
        </CardTitle>
        <CardDescription>{t("pendingDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2].map((i) => (
              <div key={`skeleton-${i}`} className="flex items-center gap-3">
                <Skeleton className="size-9 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="size-40" />
                  <Skeleton className="mt-1 h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : invites.length === 0 ? (
          <Typography.Muted className="py-4 text-center text-sm text-muted-foreground">
            {t("noPendingInvites")}
          </Typography.Muted>
        ) : (
          <div className="divide-y">
            {invites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                    <Mail className="size-4" />
                  </div>
                  <div>
                    <Typography.Text className="text-sm font-medium">
                      {invite.email}
                    </Typography.Text>
                    <Typography.Muted className="text-xs text-muted-foreground">
                      {t("pending")} &middot;{" "}
                      {new Date(invite.expires_at).toLocaleDateString()}
                    </Typography.Muted>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger>
                      <button
                        type="button"
                        className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        onClick={() => onCopyLink(invite.token)}
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
                        onClick={() => onResend(invite.id)}
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
                        onClick={() => onCancel(invite.id)}
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
  );
}
