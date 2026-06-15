"use client";

import { ArrowUpDown, CheckCircle2, RefreshCw, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useMutationQueue } from "@/lib/offline/mutation-queue-provider";

/**
 * Floating indicator showing pending offline mutations.
 * Only visible when there are pending or recently completed mutations.
 * Tap to see details in a side sheet.
 */
export function OfflineQueueIndicator() {
  const { mutations, pendingCount, isReplaying } = useMutationQueue();
  const [open, setOpen] = useState(false);
  const t = useTranslations("common");

  const relevantMutations = mutations.filter(
    (m) =>
      m.status === "pending" ||
      m.status === "in-flight" ||
      m.status === "failed",
  );

  // Don't show if queue is empty and not replaying
  if (relevantMutations.length === 0 && !isReplaying) return null;

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="fixed bottom-4 right-4 z-40 gap-2 shadow-lg"
        >
          {isReplaying ? (
            <RefreshCw className="size-4 animate-spin" />
          ) : (
            <ArrowUpDown className="size-4" />
          )}
          <Badge variant={pendingCount > 0 ? "destructive" : "secondary"}>
            {pendingCount > 0
              ? t("pendingCount", { count: pendingCount })
              : isReplaying
                ? t("syncing")
                : t("queueEmpty")}
          </Badge>
        </Button>
      </DrawerTrigger>

      <DrawerContent className="w-80">
        <DrawerHeader>
          <DrawerTitle>{t("offlineQueue")}</DrawerTitle>
        </DrawerHeader>

        <div className="mt-4 flex flex-col gap-2">
          {relevantMutations.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              {t("allChangesSynced")}
            </p>
          ) : (
            relevantMutations.map((m) => (
              <div
                key={m.id}
                className="flex items-start gap-3 rounded-lg border p-3"
              >
                {m.status === "failed" ? (
                  <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                ) : m.status === "in-flight" ? (
                  <RefreshCw className="mt-0.5 size-4 shrink-0 animate-spin text-muted-foreground" />
                ) : (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                )}
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {m.method}
                    </Badge>
                    <span className="text-muted-foreground truncate text-xs">
                      {m.endpoint.split("/").pop()}
                    </span>
                  </div>
                  {m.error && (
                    <p className="text-destructive mt-1 text-xs">{m.error}</p>
                  )}
                  <p className="text-muted-foreground mt-1 text-xs">
                    {new Date(m.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
