import { cn } from "@/lib/utils";
import { STATUS_STEPPER, STATUS_DOT } from "./_constants";

const STEP_ORDER = ["New", "Diagnosing", "In Progress", "Ready for Pickup"];

export function StatusStepper({ currentStatus }: { currentStatus: string }) {
  const currentIdx = STEP_ORDER.indexOf(currentStatus);
  const displayIdx = currentStatus === "Completed" ? 3 : currentIdx;

  const lineWidth = (() => {
    if (displayIdx <= 0) return "0%";
    const pct = (displayIdx / (STEP_ORDER.length - 1)) * 100;
    const offset = (displayIdx / (STEP_ORDER.length - 1)) * 20;
    return `calc(${pct}% - ${offset}px)`;
  })();

  const lineColor = STATUS_STEPPER[currentStatus] ?? "";

  return (
    <div className="mt-1 flex items-center justify-between w-full relative px-1 select-none isolate">
      {/* Background Line */}
      <div className="absolute top-[10px] left-2.5 right-2.5 h-0.5 bg-border -z-10" />
      {/* Active Progress Line */}
      <div
        className={cn(
          "absolute top-[10px] left-2.5 h-0.5 -z-10 transition-all duration-500 ease-in-out rounded-full",
          lineColor,
        )}
        style={{ width: lineWidth }}
      />
      {STEP_ORDER.map((step, idx) => {
        const isPast = STEP_ORDER.indexOf(step) < currentIdx;
        const isCurrent = step === currentStatus;
        const isFuture = STEP_ORDER.indexOf(step) > currentIdx;

        return (
          <div key={step} className="flex flex-col items-center gap-2">
            <div
              className={cn(
                "size-5 rounded-full border flex items-center justify-center text-xs font-black transition-all duration-300",
                isPast &&
                  STATUS_DOT["Ready for Pickup"] +
                    " border-emerald-500 text-white shadow-sm",
                isCurrent &&
                  "bg-indigo-600 border-indigo-600 text-white scale-110 shadow-sm shadow-indigo-600/30 font-bold",
                isFuture &&
                  "bg-background border-border text-muted-foreground/35",
              )}
            >
              {isPast ? "\u2713" : idx + 1}
            </div>
            <span
              className={cn(
                "text-xs font-bold leading-none tracking-tight transition-colors",
                isCurrent &&
                  "text-indigo-600 dark:text-indigo-400 font-extrabold",
                !isCurrent && "text-muted-foreground/45",
              )}
            >
              {step === "Ready for Pickup" ? "Ready" : step}
            </span>
          </div>
        );
      })}
    </div>
  );
}
