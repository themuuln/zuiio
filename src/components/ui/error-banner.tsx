import { cn } from "@/lib/utils";

export function ErrorBanner({
  error,
  className,
}: {
  error: string | Error | null | undefined;
  className?: string;
}) {
  if (!error) return null;
  const message = typeof error === "string" ? error : error.message;
  return (
    <div
      className={cn(
        "rounded-none bg-destructive/10 px-3 py-2 text-sm text-destructive shrink-0",
        className,
      )}
    >
      {message}
    </div>
  );
}
