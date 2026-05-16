"use client";

import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type SetupState = "loading" | "error" | "retrying";

export function NewUserSetup({ copy }: { copy: { title: string; subtitle: string; error: string; retry: string } }) {
  const [state, setState] = useState<SetupState>("loading");

  const runSetup = async () => {
    setState("retrying");
    try {
      const res = await fetch("/api/auth/finalize-signup", { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error?.message ?? "Setup failed");
      }
      window.location.reload();
    } catch {
      setState("error");
    }
  };

  useEffect(() => {
    runSetup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state === "error") {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="size-6 text-destructive" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            {copy.title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{copy.error}</p>
        </div>
        <Button
          variant="outline"
          onClick={runSetup}
          disabled={false}
        >
          <RefreshCw className="mr-2 size-4" />
          {copy.retry}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-center">
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
