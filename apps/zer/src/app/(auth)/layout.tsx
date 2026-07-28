import { APP_DESCRIPTION, APP_NAME } from "@/lib/constants";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden p-4 md:p-8">
      {/* Warm mesh background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,oklch(0.70_0.16_195/0.06)_0%,transparent_50%),radial-gradient(circle_at_70%_80%,oklch(0.50_0.26_275/0.05)_0%,transparent_50%),linear-gradient(180deg,oklch(1_0_0),oklch(0.96_0.01_85))]" />
      {/* Subtle grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0,transparent_calc(100%-1px),oklch(0.87_0.02_85/.4)_100%),linear-gradient(180deg,transparent_0,transparent_calc(100%-1px),oklch(0.87_0.02_85/.4)_100%)] bg-[size:24px_24px]" />
      <div className="relative grid w-full max-w-5xl gap-10 lg:grid-cols-[1.1fr_420px] lg:items-center">
        <div className="hidden lg:block">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">
            {APP_NAME}
          </p>
          <h1 className="mt-4 max-w-xl text-5xl font-semibold leading-tight tracking-tight text-foreground">
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
