import { Spinner } from "@/components/ui/spinner";

export default function RootLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <div className="flex flex-col items-center gap-6">
        <div
          className="flex size-20 items-center justify-center rounded-2xl bg-foreground"
          aria-hidden
        >
          <span className="text-5xl font-bold text-background">Z</span>
        </div>
        <span className="text-xl font-semibold text-foreground">Zer</span>
        <Spinner className="size-5 text-muted-foreground" />
      </div>
    </div>
  );
}
