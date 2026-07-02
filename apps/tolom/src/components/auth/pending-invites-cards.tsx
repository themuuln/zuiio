"use client";

import { ArrowRight, Building2, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface PendingInvite {
  token: string;
  organization_name: string;
  inviter_name: string | null;
}

interface PendingInvitesCardsProps {
  invites: PendingInvite[];
  copy: {
    title: string;
    description: string;
    accept: string;
  };
}

export function PendingInvitesCards({
  invites,
  copy,
}: PendingInvitesCardsProps) {
  const { push } = useRouter();

  if (invites.length === 0) return null;

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Building2 className="size-4 text-primary" />
          {copy.title}
        </CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {invites.map((invite) => (
          <div
            key={invite.token}
            className="flex items-center justify-between rounded-lg border bg-background p-3"
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">
                {invite.organization_name}
              </span>
              {invite.inviter_name && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <User className="size-3" />
                  {invite.inviter_name}
                </span>
              )}
            </div>
            <Button size="sm" onClick={() => push(`/invite/${invite.token}`)}>
              {copy.accept}
              <ArrowRight className="ml-1.5 size-3.5" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
