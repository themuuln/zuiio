"use client";

import { Building2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { createOrganization } from "@/app/[locale]/auth/setup-organization/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Typography } from "@/components/ui/typography";

interface PendingInvite {
  token: string;
  organization_name: string;
  inviter_name: string | null;
}

interface OrganizationSetupFormProps {
  pendingInvites: PendingInvite[];
  copy: {
    title: string;
    subtitle: string;
    orgNameLabel: string;
    orgNamePlaceholder: string;
    createOrgButton: string;
    inviteSectionTitle: string;
    inviteSectionDesc: string;
    acceptInvite: string;
  };
}

export function OrganizationSetupForm({
  pendingInvites,
  copy,
}: OrganizationSetupFormProps) {
  const { push } = useRouter();
  const [state, formAction, isPending] = useActionState(createOrganization, {});

  const prevFormError = useRef(state?.formError);
  useEffect(() => {
    if (state?.formError && state.formError !== prevFormError.current) {
      toast.error(state.formError, { duration: 5000 });
    }
    prevFormError.current = state?.formError;
  }, [state?.formError]);

  const fieldErrors = state?.fieldErrors ?? {};

  const [orgName, setOrgName] = useState("");

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <Typography.H2 className="text-lg font-semibold text-foreground">
          {copy.title}
        </Typography.H2>
        <Typography.Muted className="mt-1 text-sm text-muted-foreground">
          {copy.subtitle}
        </Typography.Muted>
      </div>

      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="size-4 text-primary" />
              {copy.inviteSectionTitle}
            </CardTitle>
            <CardDescription>{copy.inviteSectionDesc}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {pendingInvites.map((invite) => (
              <div
                key={invite.token}
                className="flex items-center justify-between rounded-lg border bg-background p-3"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">
                    {invite.organization_name}
                  </span>
                  {invite.inviter_name && (
                    <span className="text-xs text-muted-foreground">
                      Invited by {invite.inviter_name}
                    </span>
                  )}
                </div>
                <Button
                  size="sm"
                  onClick={() => push(`/invite/${invite.token}`)}
                >
                  {copy.acceptInvite}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Create Organization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="size-4 text-muted-foreground" />
            {copy.orgNameLabel}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction}>
            <FieldGroup>
              {state?.formError && (
                <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {state.formError}
                </div>
              )}

              <Field>
                <FieldLabel htmlFor="organizationName">
                  {copy.orgNameLabel}{" "}
                  <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  id="organizationName"
                  name="organizationName"
                  type="text"
                  autoComplete="organization"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder={copy.orgNamePlaceholder}
                  aria-invalid={"organizationName" in fieldErrors || undefined}
                />
                {"organizationName" in fieldErrors && (
                  <FieldError>{fieldErrors.organizationName}</FieldError>
                )}
              </Field>

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Building2 />
                )}
                {copy.createOrgButton}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
