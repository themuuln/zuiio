"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CommonT, VehicleFormT } from "./_types";

// ── Component ────────────────────────────────────────────────

type FormFooterProps = {
  onCancel?: () => void;
  /** True while a submit is in flight (disables the submit button). */
  disabled: boolean;
  isSubmitting: boolean;
  t: VehicleFormT;
  commonT: CommonT;
};

/** Cancel/Save action row rendered at the bottom of the form. */
export function FormFooter({
  onCancel,
  disabled,
  isSubmitting,
  t,
  commonT,
}: FormFooterProps) {
  return (
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      {onCancel && (
        <Button
          variant="outline"
          type="button"
          onClick={onCancel}
          className="h-11 px-6"
        >
          {commonT("cancel")}
        </Button>
      )}
      <Button
        type="submit"
        disabled={disabled}
        className="h-11 px-6 min-w-[140px]"
      >
        {isSubmitting ? (
          <span className="flex items-center gap-2 justify-center">
            <Loader2 className="size-4 animate-spin" />
            {t("saving")}
          </span>
        ) : (
          t("addVehicle")
        )}
      </Button>
    </div>
  );
}
