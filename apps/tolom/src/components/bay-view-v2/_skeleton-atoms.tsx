import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Inline skeleton atoms for bay view.
 *
 * Each atom matches the exact dimensions and styling of the real value it
 * replaces, so the transition from skeleton → content is pixel-perfect.
 * These are used inside card shells that always render — never as
 * section-level replacement blocks.
 */

/* ── StatChip value skeleton ────────────────────────────── */
export function StatChipSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-baseline gap-2 text-xs px-2.5 py-1.5 shrink-0",
        className,
      )}
    >
      <Skeleton className="h-3 w-12" />
      <Skeleton className="h-5 w-10" />
    </div>
  );
}

/* ── License plate skeleton ─────────────────────────────── */
export function PlateSkeleton({ className }: { className?: string }) {
  return (
    <Skeleton
      className={cn(
        "h-[22px] w-[72px] rounded-[4px] border border-border/20",
        className,
      )}
    />
  );
}

/* ── Elapsed timer pill skeleton ────────────────────────── */
export function TimerSkeleton({ className }: { className?: string }) {
  return (
    <Skeleton
      className={cn(
        "inline-flex h-[22px] w-[60px] rounded-md border border-border/20",
        className,
      )}
    />
  );
}

/* ── Vehicle name line skeleton ─────────────────────────── */
export function VehicleNameSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn("h-4 w-36 rounded", className)} />;
}

/* ── Mechanic badge skeleton (avatar circle + name) ─────── */
export function MechanicBadgeSkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Skeleton className="size-6 rounded-full" />
      <Skeleton className="h-3.5 w-16 rounded" />
    </div>
  );
}

/* ── Bay card footer button skeleton ────────────────────── */
export function FooterButtonSkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <Skeleton className={cn("h-7 w-16 rounded-lg", className)} />
  );
}

/* ── Bay card occupied layout skeleton ──────────────────── *
 * Matches the full occupied card structure:
 *   header  →  separator  →  content  →  separator  →  footer
 */
export function BayCardOccupiedSkeleton() {
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5">
        <Skeleton className="h-4 w-8 rounded" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="h-px bg-border/40" />

      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 px-4 py-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <PlateSkeleton />
            <TimerSkeleton />
          </div>
          <VehicleNameSkeleton />
        </div>
        <MechanicBadgeSkeleton />
      </div>
      <div className="h-px bg-border/40" />

      {/* Footer */}
      <div className="flex items-center gap-3 px-4 py-2">
        <Skeleton className="h-3 w-24 rounded flex-1" />
        <FooterButtonSkeleton />
      </div>
    </>
  );
}

/* ── Bay card empty layout skeleton ─────────────────────── *
 * Matches the empty bay card: large circle + "Empty" text
 */
export function BayCardEmptySkeleton() {
  return (
    <div className="flex min-h-[160px] flex-col items-center justify-center gap-3 p-4">
      <Skeleton className="size-10 rounded-full" />
      <Skeleton className="h-3.5 w-12 rounded" />
    </div>
  );
}
