import { toast } from "sonner";

/**
 * Shows an error toast with a "Retry" button that re-runs the given async function.
 * On retry failure, shows a plain error toast (no nested retry to avoid loops).
 */
export function toastRetry(
  message: string,
  retry: () => Promise<unknown>,
  duration = 6000,
) {
  toast.error(message, {
    action: {
      label: "Retry",
      onClick: () => {
        retry().catch((e) => {
          toast.error(
            e instanceof Error
              ? e.message
              : "Still failed. Please try again.",
          );
        });
      },
    },
    duration,
  });
}
