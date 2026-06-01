"use client";

import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";

type SetupState = "loading" | "error";

interface NewUserSetupCopy {
  title: string;
  subtitle: string;
  error: string;
  retry: string;
}

export function NewUserSetup({ copy }: { copy: NewUserSetupCopy }) {
  const [state, setState] = useState<SetupState>("loading");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const setupStarted = useRef(false);

  const runSetup = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/finalize-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const resBody = await res.json().catch(() => ({}));
        throw new Error(resBody?.error?.message ?? "Setup failed");
      }
      window.location.reload();
    } catch {
      setState("error");
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  useEffect(() => {
    if (setupStarted.current) return;
    setupStarted.current = true;
    runSetup();
  }, [runSetup]);

  if (state === "error") {
    return (
      <div className="flex flex-col gap-4 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="size-6 text-destructive" />
        </div>
        <div>
          <Typography.H2 className="text-lg font-semibold text-foreground">
            {copy.title}
          </Typography.H2>
          <Typography.Muted className="mt-1 text-sm text-muted-foreground">
            {copy.error}
          </Typography.Muted>
        </div>

        <Button
          variant="outline"
          onClick={() => runSetup()}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 size-4" />
          )}
          {copy.retry}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
      <div>
        <Typography.H2 className="text-lg font-semibold text-foreground">
          {copy.title}
        </Typography.H2>
        <Typography.Muted className="mt-1 text-sm text-muted-foreground">
          {copy.subtitle}
        </Typography.Muted>
      </div>
    </div>
  );
}
