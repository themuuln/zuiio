"use client";

import { AlertCircle, Building2, Loader2, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

type SetupState = "loading" | "error" | "manual";

interface NewUserSetupCopy {
  title: string;
  subtitle: string;
  error: string;
  retry: string;
  manualSetup: string;
  orgNameLabel: string;
  orgNamePlaceholder: string;
  createOrg: string;
  manualError: string;
}

export function NewUserSetup({ copy }: { copy: NewUserSetupCopy }) {
  const [state, setState] = useState<SetupState>("loading");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [manualError, setManualError] = useState("");

  const runSetup = async (name?: string) => {
    setIsSubmitting(true);
    setManualError("");
    try {
      const body = name?.trim() ? { orgName: name.trim() } : undefined;
      const res = await fetch("/api/auth/finalize-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        const resBody = await res.json().catch(() => ({}));
        throw new Error(resBody?.error?.message ?? "Setup failed");
      }
      window.location.reload();
    } catch {
      setState(name ? "manual" : "error");
      if (name) setManualError(copy.manualError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) return;
    runSetup(orgName.trim());
  };

  useEffect(() => {
    runSetup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state === "manual") {
    return (
      <div className="flex flex-col gap-4">
        <div className="text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10">
            <Building2 className="size-6 text-primary" />
          </div>
          <h2 className="mt-3 text-lg font-semibold text-foreground">
            {copy.manualSetup}
          </h2>
        </div>

        {manualError && (
          <div className="rounded-md bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">
            {manualError}
          </div>
        )}

        <form onSubmit={handleManualSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="orgName"
              className="text-sm font-medium text-foreground"
            >
              {copy.orgNameLabel}
            </label>
            <Input
              id="orgName"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder={copy.orgNamePlaceholder}
              required
              minLength={2}
            />
          </div>

          <div className="flex flex-col gap-3">
            <Button type="submit" disabled={isSubmitting || !orgName.trim()}>
              {isSubmitting ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Building2 className="mr-2 size-4" />
              )}
              {copy.createOrg}
            </Button>

            <Separator />

            <Button
              type="button"
              variant="outline"
              onClick={() => runSetup()}
              disabled={isSubmitting}
            >
              <RefreshCw className="mr-2 size-4" />
              {copy.retry}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="flex flex-col gap-4 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="size-6 text-destructive" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            {copy.title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{copy.error}</p>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            variant="outline"
            onClick={() => runSetup()}
            disabled={isSubmitting}
          >
            <RefreshCw className="mr-2 size-4" />
            {copy.retry}
          </Button>

          <Separator />

          <Button variant="secondary" onClick={() => setState("manual")}>
            <Building2 className="mr-2 size-4" />
            {copy.manualSetup}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-foreground">{copy.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{copy.subtitle}</p>
      </div>
    </div>
  );
}
