import { useState, useCallback } from "react";
import { useDatabase } from "@/database/provider";

interface OfflineMutationOptions<TInput> {
  /** Execute the mutation online (Supabase). */
  online: (input: TInput) => Promise<any>;
  /** Execute the mutation offline (WatermelonDB). */
  offline: (input: TInput) => Promise<any>;
  /** Called after both online and offline succeed. */
  onSuccess?: () => void;
  /** Called on error. */
  onError?: (error: Error) => void;
}

interface OfflineMutationResult<TInput> {
  mutate: (input: TInput) => Promise<void>;
  isPending: boolean;
  error: Error | null;
}

/**
 * Mutation that writes to both Supabase (online) and WatermelonDB (offline).
 * If online fails, still writes locally and queues for sync.
 */
export function useOfflineMutation<TInput>({
  online,
  offline,
  onSuccess,
  onError,
}: OfflineMutationOptions<TInput>): OfflineMutationResult<TInput> {
  const { triggerSync } = useDatabase();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (input: TInput) => {
      setIsPending(true);
      setError(null);

      try {
        // Always write offline first (fast local write)
        await offline(input);

        // Try online write
        try {
          await online(input);
        } catch (onlineErr) {
          // Online failed — that's OK, sync engine will retry
          console.warn("Online write failed, will sync later:", onlineErr);
        }

        // Trigger background sync
        triggerSync().catch(() => {});

        onSuccess?.();
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        onError?.(error);
      } finally {
        setIsPending(false);
      }
    },
    [online, offline, triggerSync, onSuccess, onError]
  );

  return { mutate, isPending, error };
}
