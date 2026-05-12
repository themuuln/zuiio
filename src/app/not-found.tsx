import Link from "next/link";

export default function RootNotFoundPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-muted-foreground/30">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Хуудас олдсонгүй</h2>
        <p className="mt-2 text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
