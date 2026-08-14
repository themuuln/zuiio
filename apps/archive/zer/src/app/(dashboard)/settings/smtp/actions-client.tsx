"use client";

import { Trash } from "@phosphor-icons/react";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { deleteSmtpConfig, toggleSmtpConfig } from "./actions";

export function DeleteButton({ configId }: { configId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={() => {
        startTransition(async () => {
          await deleteSmtpConfig(configId);
        });
      }}
    >
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        disabled={isPending}
        className="text-destructive hover:text-destructive"
      >
        <Trash className="size-4" />
      </Button>
    </form>
  );
}

export function ToggleButton({
  configId,
  isActive,
}: {
  configId: string;
  isActive: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Switch
      checked={isActive}
      disabled={isPending}
      onCheckedChange={(checked) => {
        startTransition(async () => {
          await toggleSmtpConfig(configId, checked);
        });
      }}
    />
  );
}
