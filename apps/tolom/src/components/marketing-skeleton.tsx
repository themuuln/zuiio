import { Skeleton } from "@/components/ui/skeleton";

/**
 * Shared loading skeleton for marketing pages.
 * Provides instant navigation feedback while the page loads.
 */
export function MarketingPageSkeleton() {
  return (
    <div className="flex min-h-dvh flex-col">
      {/* Nav skeleton */}
      <header className="flex h-14 items-center border-b px-4 sm:px-6">
        <Skeleton className="size-8" />
        <Skeleton className="ml-2 h-4 w-20" />
        <div className="ml-auto flex gap-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
      </header>

      <main className="flex-1">
        {/* Hero section skeleton */}
        <section className="border-b px-4 pt-16 pb-12 sm:px-6 sm:pt-24 sm:pb-16">
          <div className="mx-auto max-w-2xl text-center">
            <Skeleton className="mx-auto h-5 w-16" />
            <Skeleton className="mx-auto mt-4 h-10 w-64 sm:h-12" />
            <Skeleton className="mx-auto mt-4 h-6 w-48" />
            <div className="mt-8 flex justify-center gap-4">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </section>

        {/* Content section skeleton */}
        <section className="px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-3xl">
            <Skeleton className="h-8 w-48" />
            <div className="flex flex-col mt-6 gap-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          </div>
        </section>

        {/* Cards section skeleton */}
        <section className="border-t bg-muted/20 px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-5xl">
            <Skeleton className="mx-auto h-8 w-48" />
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl border bg-card p-6">
                  <Skeleton className="mx-auto size-12 rounded-xl" />
                  <Skeleton className="mx-auto mt-4 h-5 w-24" />
                  <Skeleton className="mx-auto mt-2 h-4 w-32" />
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer skeleton */}
      <footer className="border-t bg-background px-4 py-8 text-center sm:px-6">
        <Skeleton className="mx-auto h-4 w-48" />
      </footer>
    </div>
  );
}
