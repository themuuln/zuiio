"use client";

import { Building2, Info, KeyRound, Loader2, Search } from "lucide-react";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Typography } from "@/components/ui/typography";
import type { CompleteOrganizationLoginState } from "@/lib/actions/complete-organization-login";
import type { UserOrganizationAccessOption } from "@/lib/services/organization-access-service";

const DEV_PIN = "1234";

interface OrganizationSelectionFormProps {
  organizations: UserOrganizationAccessOption[];
  action: (
    state: CompleteOrganizationLoginState,
    formData: FormData,
  ) => Promise<CompleteOrganizationLoginState>;
  redirectTo?: string;
  /** When true, hides the org selector and shows contextual copy (single-org mode). */
  singleOrgMode?: boolean;
  copy: {
    title: string;
    subtitle: string;
    pinExplanation: string;
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
  singleOrgMode = false,
  copy,
}: OrganizationSelectionFormProps) {
  const [state, formAction, isPending] = useActionState(action, {});
  const formRef = useRef<HTMLFormElement>(null);
  const [pin, setPin] = useState(DEV_PIN);
  const [confirmPin, setConfirmPin] = useState(DEV_PIN);
  const [searchQuery, setSearchQuery] = useState("");

  const fieldErrors = state?.fieldErrors ?? {};
  const hasFormError = !!state?.formError;

  const prevFormError = useRef(state?.formError);
  useEffect(() => {
    if (state?.formError && state.formError !== prevFormError.current) {
      toast.error(state.formError);
    }
    prevFormError.current = state?.formError;
  }, [state?.formError]);

  const filteredOrganizations = useMemo(
    () =>
      searchQuery
        ? organizations.filter((org) =>
            org.name.toLowerCase().includes(searchQuery.toLowerCase()),
          )
        : organizations,
    [organizations, searchQuery],
  );

  const [organizationId, setOrganizationId] = useState(
    () =>
      organizations.find((organization) => organization.isPrimary)
        ?.organizationId ??
      organizations[0]?.organizationId ??
      "",
  );

  // Reset selection when filter hides the currently selected org
  useEffect(() => {
    if (
      searchQuery &&
      !filteredOrganizations.some(
        (org) => org.organizationId === organizationId,
      ) &&
      filteredOrganizations.length > 0
    ) {
      setOrganizationId(filteredOrganizations[0].organizationId);
    }
  }, [searchQuery, filteredOrganizations, organizationId]);

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
        <Typography.H2 className="text-lg font-semibold text-foreground">
          {copy.title}
        </Typography.H2>
        <Typography.Muted className="text-sm text-muted-foreground">
          {copy.noOrganizations}
        </Typography.Muted>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 text-center">
        <Typography.H2 className="text-lg font-semibold text-foreground">
          {copy.title}
        </Typography.H2>
        <Typography.Muted className="mt-1 text-sm text-muted-foreground">
          {copy.subtitle}
        </Typography.Muted>
      </div>

      <form
        ref={formRef}
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
          <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {state.formError}
          </div>
        )}

        {/* Org selector — hidden in single-org mode */}
        {!singleOrgMode && (
          <div className="flex flex-col gap-1.5">
            {/* Search input */}
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={copy.organizationLabel}
                className="h-9 pl-9 text-sm bg-muted/10"
              />
            </div>
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
                className={`h-10 w-full rounded-lg border bg-background py-2 pr-3 pl-9 text-sm text-foreground shadow-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 ${
                  "organizationId" in fieldErrors
                    ? "border-destructive ring-1 ring-destructive/20"
                    : "border-input"
                }`}
                aria-invalid={"organizationId" in fieldErrors || undefined}
              >
                {filteredOrganizations.length > 0 ? (
                  filteredOrganizations.map((organization) => (
                    <option
                      key={organization.organizationId}
                      value={organization.organizationId}
                    >
                      {organization.name}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    {copy.noOrganizations}
                  </option>
                )}
              </select>
            </div>
            {"organizationId" in fieldErrors && (
              <Typography.Text className="text-sm text-destructive">
                {fieldErrors.organizationId}
              </Typography.Text>
            )}
            <Typography.Muted className="text-xs text-muted-foreground">
              {selectedOrganization?.slug ?? copy.organizationPlaceholder}
            </Typography.Muted>
          </div>
        )}

        {/* Hidden input for single-org mode to still submit the org ID */}
        {singleOrgMode && (
          <input type="hidden" name="organizationId" value={organizationId} />
        )}

        {/* PIN explanation banner */}
        <div className="flex items-start gap-2 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          <span>{copy.pinExplanation}</span>
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
              className={`w-full rounded-lg border bg-background px-3 py-2 pl-9 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 ${
                "pin" in fieldErrors || hasFormError
                  ? "border-destructive ring-1 ring-destructive/20"
                  : "border-input"
              }`}
              placeholder={copy.pinPlaceholder}
              aria-invalid={"pin" in fieldErrors || hasFormError || undefined}
            />
          </div>
          {"pin" in fieldErrors && (
            <Typography.Text className="text-sm text-destructive">
              {fieldErrors.pin}
            </Typography.Text>
          )}
          <Typography.Muted className="text-xs text-muted-foreground">
            {selectedOrganization?.hasBayViewPin
              ? copy.verifyHint
              : copy.setupHint}
          </Typography.Muted>
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
              className={`w-full rounded-lg border bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 ${
                "confirmPin" in fieldErrors || hasFormError
                  ? "border-destructive ring-1 ring-destructive/20"
                  : "border-input"
              }`}
              placeholder={copy.pinPlaceholder}
              aria-invalid={
                "confirmPin" in fieldErrors || hasFormError || undefined
              }
            />
            {"confirmPin" in fieldErrors && (
              <Typography.Text className="text-sm text-destructive">
                {fieldErrors.confirmPin}
              </Typography.Text>
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
