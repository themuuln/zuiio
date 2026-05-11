export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-muted/30 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            TOLOM
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Auto service management platform
          </p>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
