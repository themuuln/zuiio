import { unstable_cache } from "next/cache";

/**
 * Wraps a data-fetching function with Next.js Data Cache using `unstable_cache`.
 *
 * Call this from within service read functions. The supabase client should be
 * created **outside** the `fn` callback (it runs in a cached context where
 * dynamic APIs like `cookies()` are not available). Only the actual query
 * execution should go inside `fn`.
 *
 * @param keyParts - Unique cache key segments (included in the cache key computation)
 * @param fn       - Pure-ish async function returning data to cache (no dynamic APIs)
 * @param options  - Cache tags (for targeted invalidation via revalidateTag) and revalidate duration
 * @returns The cached (or freshly fetched) data
 *
 * @example
 * ```ts
 * export async function getBranches(orgId: string) {
 *   const supabase = await createClient(); // dynamic — outside cache scope
 *
 *   return withCache(
 *     ["branches", orgId],
 *     async () => {
 *       const { data, error } = await supabase.from("branches").select("*");
 *       if (error) throw error;
 *       return data;
 *     },
 *     { tags: [cacheTags.branches(orgId)], revalidate: cacheDurations.branches },
 *   );
 * }
 * ```
 */
export function withCache<T>(
  keyParts: string[],
  fn: () => Promise<T>,
  options?: {
    tags?: string[];
    revalidate?: number;
  },
): Promise<T> {
  const cachedFn = unstable_cache(
    async () => fn(),
    keyParts,
    {
      tags: options?.tags,
      revalidate: options?.revalidate,
    },
  );
  return cachedFn();
}
