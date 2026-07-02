"use client";

import { Check, Spinner } from "@phosphor-icons/react";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useSettings } from "./settings-context";

export function SettingsFooter() {
  const { saveAll, saving, dirtyCount, dirtySections } = useSettings();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleConfirmSave = async () => {
    setConfirmOpen(false);
    const errorCount = await saveAll();
    if (errorCount === 0) {
      toast.success("Бүх тохиргоо амжилттай хадгалагдлаа.");
    } else {
      toast.error(
        `${errorCount} хэсэгт алдаа гарлаа. Дэлгэрэнгүй мэдээллийг шалгана уу.`,
      );
    }
  };

  return (
    <div className="sticky bottom-0 z-10 -mx-6 -mb-6 mt-8 border-t bg-background/95 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {dirtyCount > 0
            ? `${dirtyCount} хэсэгт өөрчлөлт оруулсан`
            : "Өөрчлөлт оруулаагүй"}
        </p>
        <button
          type="button"
          disabled={dirtyCount === 0 || saving}
          onClick={() => dirtyCount > 0 && setConfirmOpen(true)}
          className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
        >
          {saving ? (
            <>
              <Spinner className="size-4 animate-spin" />
              Хадгалж байна...
            </>
          ) : (
            <>
              <Check className="size-4" />
              Хадгалах
            </>
          )}
        </button>
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Өөрчлөлтүүдийг хадгалах уу?</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Дараах өөрчлөлтүүдийг хадгалах гэж байна:
                  </p>
                  <div className="space-y-3">
                    {dirtySections.map((section) => (
                      <div
                        key={section.id}
                        className="rounded-lg border bg-muted/50 p-3"
                      >
                        <p className="mb-1 text-sm font-medium">
                          {section.label}
                        </p>
                        {section.changes.length > 0 ? (
                          <div className="space-y-1">
                            {section.changes.map((change, i) => (
                              <div
                                key={i}
                                className="flex items-start gap-2 text-xs"
                              >
                                <span className="shrink-0 rounded bg-blue-100 px-1 py-0.5 font-mono text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                                  {change.field}
                                </span>
                                <div className="flex items-center gap-1.5 overflow-hidden">
                                  <span className="truncate rounded bg-destructive/10 px-1 py-0.5 text-destructive line-through decoration-destructive">
                                    {change.from}
                                  </span>
                                  <span className="text-muted-foreground">
                                    →
                                  </span>
                                  <span className="truncate rounded bg-emerald-100 px-1 py-0.5 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                                    {change.to}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            Өөрчлөлт оруулсан
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Буцах</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmSave}>
                Хадгалах
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
