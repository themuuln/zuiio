import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <div className="max-w-md text-center px-6">
        <h1 className="text-6xl font-bold text-foreground mb-2">404</h1>
        <h2 className="text-xl font-semibold text-foreground mb-2">Page not found</h2>
        <p className="text-sm text-muted-foreground mb-6">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block h-9 px-4 rounded-lg border border-accent/70 bg-accent/15 text-text text-sm font-semibold leading-9 no-underline transition-all hover:bg-accent/25"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
