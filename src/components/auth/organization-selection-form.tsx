"use client";

import { Building2, KeyRound, Loader2 } from "lucide-react";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { CompleteOrganizationLoginState } from "@/lib/actions/complete-organization-login";
import type { UserOrganizationAccessOption } from "@/lib/services/organization-access-service";

interface OrganizationSelectionFormProps {
  organizations: UserOrganizationAccessOption[];
  action: (
    state: CompleteOrganizationLoginState,
    formData: FormData,
  ) => Promise<CompleteOrganizationLoginState>;
  redirectTo?: string;
  copy: {
    title: string;
    subtitle: string;
    organizationLabel: string;
    organizationPlaceholder: string;
    pinLabel: string;
    pinPlaceholder: string;
    confirmPinLabel: string;
    continueLabel: string;
    setupLabel: string;
    setupHint: string;
    verifyHint: string;
    noOrganizations: string;
  };
}

export function OrganizationSelectionForm({
  organizations,
  action,
  redirectTo,
  copy,
}: OrganizationSelectionFormProps) {
  const [state, formAction, isPending] = useActionState(action, {});
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const fieldErrors = state?.fieldErrors ?? {};
  const hasFormError = !!state?.formError;

  const prevFormError = useRef(state?.formError);
  useEffect(() => {
    if (state?.formError && state.formError !== prevFormError.current) {
      toast.error(state.formError);
    }
    prevFormError.current = state?.formError;
  }, [state?.formError]);

  const [organizationId, setOrganizationId] = useState(
    organizations.find((organization) => organization.isPrimary)
      ?.organizationId ??
      organizations[0]?.organizationId ??
      "",
  );

  const selectedOrganization = useMemo(
    () =>
      organizations.find(
        (organization) => organization.organizationId === organizationId,
      ) ?? null,
    [organizationId, organizations],
  );

  useEffect(() => {
    if (state?.redirectTo) {
      window.location.replace(state.redirectTo);
    }
  }, [state?.redirectTo]);

  if (organizations.length === 0) {
    return (
      <div className="flex flex-col gap-3 text-center">
        <h2 className="text-lg font-semibold text-foreground">{copy.title}</h2>
        <p className="text-sm text-muted-foreground">{copy.noOrganizations}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="text-lg font-semibold text-foreground">{copy.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{copy.subtitle}</p>
      </div>

      <form
        action={formAction}
        className="flex flex-col gap-4"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            e.currentTarget.requestSubmit();
          }
        }}
      >
        {redirectTo && (
          <input type="hidden" name="redirectTo" value={redirectTo} />
        )}
        {state?.formError && (
          <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {state.formError}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="organizationId"
            className="text-sm font-medium text-foreground"
          >
            {copy.organizationLabel}
          </label>
          <div className="relative">
            <Building2 className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <select
              id="organizationId"
              name="organizationId"
              value={organizationId}
              onChange={(event) => setOrganizationId(event.target.value)}
              onKeyDown={(e) => e.key === "Enter" && e.stopPropagation()}
              className={`h-10 w-full rounded-md border bg-background py-2 pr-3 pl-9 text-sm text-foreground shadow-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 ${"organizationId" in fieldErrors ? "border-destructive ring-1 ring-destructive/20" : "border-input"}`}
              aria-invalid={"organizationId" in fieldErrors || undefined}
            >
              {organizations.map((organization) => (
                <option
                  key={organization.organizationId}
                  value={organization.organizationId}
                >
                  {organization.name}
                </option>
              ))}
            </select>
          </div>
          {"organizationId" in fieldErrors && (
            <p className="text-sm text-destructive">
              {fieldErrors.organizationId}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {selectedOrganization?.slug ?? copy.organizationPlaceholder}
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="pin" className="text-sm font-medium text-foreground">
            {copy.pinLabel}
          </label>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="pin"
              name="pin"
              type="password"
              inputMode="numeric"
              pattern="[0-9]{4,6}"
              minLength={4}
              maxLength={6}
              required
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className={`w-full rounded-md border bg-background px-3 py-2 pl-9 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 ${"pin" in fieldErrors || hasFormError ? "border-destructive ring-1 ring-destructive/20" : "border-input"}`}
              placeholder={copy.pinPlaceholder}
              aria-invalid={"pin" in fieldErrors || hasFormError || undefined}
            />
          </div>
          {"pin" in fieldErrors && (
            <p className="text-sm text-destructive">{fieldErrors.pin}</p>
          )}
          <p className="text-xs text-muted-foreground">
            {selectedOrganization?.hasBayViewPin
              ? copy.verifyHint
              : copy.setupHint}
          </p>
        </div>

        {!selectedOrganization?.hasBayViewPin && (
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="confirmPin"
              className="text-sm font-medium text-foreground"
            >
              {copy.confirmPinLabel}
            </label>
            <input
              id="confirmPin"
              name="confirmPin"
              type="password"
              inputMode="numeric"
              pattern="[0-9]{4,6}"
              minLength={4}
              maxLength={6}
              required
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              className={`w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 ${"confirmPin" in fieldErrors || hasFormError ? "border-destructive ring-1 ring-destructive/20" : "border-input"}`}
              placeholder={copy.pinPlaceholder}
              aria-invalid={
                "confirmPin" in fieldErrors || hasFormError || undefined
              }
            />
            {"confirmPin" in fieldErrors && (
              <p className="text-sm text-destructive">
                {fieldErrors.confirmPin}
              </p>
            )}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? <Loader2 className="animate-spin" /> : <KeyRound />}
          {selectedOrganization?.hasBayViewPin
            ? copy.continueLabel
            : copy.setupLabel}
        </Button>
      </form>
    </div>
  );
}
