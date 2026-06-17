"use client";

import { Check, Spinner } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useSettings } from "./settings-context";

export function SettingsFooter() {
  const { saveAll, saving } = useSettings();

  const handleSave = async () => {
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
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
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
      </div>
    </div>
  );
}
