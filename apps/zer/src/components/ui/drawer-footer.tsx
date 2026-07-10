import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Fixed footer area for drawer action buttons.
 * Renders a sticky bottom bar with a top border.
 */
export function DrawerFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("flex shrink-0 items-center justify-end gap-3", className)}
    >
      {children}
    </div>
  );
}

/**
 * Cancel button that closes the drawer.
 * Uses `onClick` to call the drawer's `onOpenChange(false)`.
 */
export function DrawerCancel({
  onClick,
  label = "Цуцлах",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={buttonVariants({ variant: "outline" })}
    >
      {label}
    </button>
  );
}

/**
 * Submit button linked to a form via `form` attribute.
 */
export function DrawerSubmit({
  form,
  isPending = false,
  label = "Хадгалах",
  loadingLabel = "Хадгалах...",
  "data-testid": dataTestId,
}: {
  form?: string;
  isPending?: boolean;
  label?: string;
  loadingLabel?: string;
  "data-testid"?: string;
}) {
  return (
    <button
      type="submit"
      form={form}
      disabled={isPending}
      data-testid={dataTestId}
      className={buttonVariants({ variant: "default" })}
    >
      {isPending ? loadingLabel : label}
    </button>
  );
}
