import { APP_DESCRIPTION, APP_NAME } from "@/lib/constants";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_oklch(0.97_0_0),_transparent_38%),linear-gradient(180deg,_oklch(1_0_0),_oklch(0.96_0.01_85))] p-4 md:p-8">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0,transparent_calc(100%-1px),oklch(0.9_0_0/.5)_100%),linear-gradient(180deg,transparent_0,transparent_calc(100%-1px),oklch(0.9_0_0/.5)_100%)] bg-[size:24px_24px] opacity-40" />
      <div className="relative grid w-full max-w-5xl gap-10 lg:grid-cols-[1.1fr_420px] lg:items-center">
        <div className="hidden lg:block">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
            {APP_NAME}
          </p>
          <h1 className="mt-4 max-w-xl text-5xl font-semibold leading-tight tracking-tight text-[oklch(0.22_0.02_55)]">
            Монгол жижиг бизнесийн өдөр тутмын ажиллагааг нэг төвөөс удирдана.
          </h1>
          <p className="mt-4 max-w-lg text-base text-muted-foreground">
            {APP_DESCRIPTION}
          </p>
        </div>
        <div className="relative">{children}</div>
      </div>
    </div>
  );
}
