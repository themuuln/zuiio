import { Search } from "lucide-react";
import Link from "next/link";

export default function StorefrontNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="mb-6 flex size-16 items-center justify-center rounded-full bg-muted">
        <Search className="size-8" aria-hidden="true" />
      </div>
      <h1 className="mb-2 text-2xl font-semibold">Shop Not Found</h1>
      <p className="mb-6 max-w-md text-muted-foreground">
        We couldn&apos;t find a shop with this address. Please check the link
        and try again.
      </p>
      <Link
        href="/"
        className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
      >
        Go Home
      </Link>
    </div>
  );
}
