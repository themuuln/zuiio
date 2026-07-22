"use client";

import { Copy, Mail, RefreshCw, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Typography } from "@/components/ui/typography";
import type { InviteWithEmail } from "./types";

interface PendingInvitesProps {
  loading: boolean;
  invites: InviteWithEmail[];
  onCopyLink: (token: string) => void;
  onResend: (inviteId: string) => void;
  onCancel: (inviteId: string) => void;
  t: (key: string, values?: Record<string, string | number>) => string;
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
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="gap-3 pb-4">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="size-4" />
            {t("pendingInvites")}
          </CardTitle>
          <Badge variant="secondary" className="rounded-full px-2.5 py-0.5">
            {t("pendingCount", { count: invites.length })}
          </Badge>
        </div>
        <CardDescription>{t("pendingDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2].map((i) => (
              <div
                key={`skeleton-${i}`}
                className="flex items-center gap-3 rounded-xl border border-border/50 p-3"
              >
                <Skeleton className="size-9 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="mt-1 h-3 w-20" />
                </div>
                <Skeleton className="h-8 w-24" />
              </div>
            ))}
          </div>
        ) : invites.length === 0 ? (
          <Empty className="border border-dashed border-border/70 bg-muted/20">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Mail />
              </EmptyMedia>
              <EmptyTitle>{t("noPendingInvites")}</EmptyTitle>
              <EmptyDescription>
                {t("noPendingInvitesDescription")}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-col gap-3">
            {invites.map((invite) => (
              <div
                key={invite.id}
                className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-muted text-xs font-medium text-muted-foreground">
                    <Mail className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <Typography.Text className="block truncate text-sm font-medium">
                      {invite.email}
                    </Typography.Text>
                    <Typography.Muted className="block truncate text-xs text-muted-foreground">
                      {t("pending")} &middot;{" "}
                      {new Date(invite.expires_at).toLocaleDateString()}
                    </Typography.Muted>
                  </div>
                </div>
                <div className="flex items-center gap-1 sm:justify-end">
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
