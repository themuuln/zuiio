import {
  BarChart3,
  ClipboardList,
  LayoutDashboard,
  Package,
  Users,
  Wrench,
} from "lucide-react";

/**
 * Decorative mini dashboard for the auth left panel.
 *
 * Mirrors the landing page's product preview (browser-frame UI) so the auth
 * screen shows what the product actually looks like. `aria-hidden` — purely
 * visual, never read by assistive technology. Numbers and bars are fake data.
 */
export function AuthShowcaseMock({ appName }: { appName: string }) {
  const sidebarIcons = [LayoutDashboard, ClipboardList, Users, Package];

  const kpis = [
    { value: "24", delta: "+12%" },
    { value: "08", delta: "+4%" },
    { value: "₮4.8M", delta: "+18%" },
  ];

  const rows = [
    {
      icon: ClipboardList,
      bar: "w-3/5",
      iconTone: "bg-primary/15 text-primary",
      dot: "bg-emerald-400",
    },
    {
      icon: Users,
      bar: "w-2/5",
      iconTone: "bg-emerald-500/15 text-emerald-400",
      dot: "bg-amber-400",
    },
    {
      icon: Package,
      bar: "w-1/3",
      iconTone: "bg-amber-500/15 text-amber-400",
      dot: "bg-zinc-500",
    },
  ];

  return (
    <div className="relative mx-auto w-full max-w-lg" aria-hidden="true">
      {/* Soft glow behind the frame */}
      <div className="absolute -inset-6 rounded-[2rem] bg-primary/10 blur-3xl" />

      {/* App frame */}
      <div className="relative overflow-hidden rounded-xl bg-white/[0.03] shadow-2xl shadow-black/40 backdrop-blur-sm">
        {/* Window header */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--brand-violet)] to-[var(--brand-teal)]">
              <Wrench className="size-3.5 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white/90">{appName}</p>
              <div className="mt-1 h-1 w-20 rounded-full bg-white/10" />
            </div>
          </div>
          <span className="flex size-5 items-center justify-center rounded-full border border-white/10 bg-white/5">
            <span className="size-1.5 rounded-full bg-emerald-400" />
          </span>
        </div>

        {/* Sidebar rail + content */}
        <div className="grid grid-cols-[2.75rem_1fr]">
          <div className="flex flex-col items-center gap-3 border-r border-white/10 bg-white/[0.02] py-4">
            {sidebarIcons.map((Icon, index) => (
              <div
                key={index}
                className={
                  index === 0
                    ? "flex size-7 items-center justify-center rounded-md bg-primary/15 text-primary"
                    : "flex size-7 items-center justify-center rounded-md text-white/30"
                }
              >
                <Icon className="size-3.5" />
              </div>
            ))}
          </div>

          <div className="min-w-0 p-3.5">
            {/* KPI tiles */}
            <div className="grid grid-cols-3 gap-2">
              {kpis.map((kpi) => (
                <div
                  key={kpi.value}
                  className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-2"
                >
                  <div className="h-1 w-10 rounded-full bg-white/15" />
                  <p className="mt-1.5 text-sm font-semibold text-white/90 tabular-nums">
                    {kpi.value}
                  </p>
                  <p className="mt-0.5 text-[10px] font-medium text-emerald-400">
                    {kpi.delta}
                  </p>
                </div>
              ))}
            </div>

            {/* Work order rows */}
            <div className="mt-2.5 rounded-lg border border-white/10 bg-white/[0.03]">
              <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
                <div className="h-2 w-24 rounded-full bg-white/15" />
                <BarChart3 className="size-3 text-white/25" />
              </div>
              <div className="divide-y divide-white/5">
                {rows.map((row, index) => {
                  const Icon = row.icon;
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-2.5 px-3 py-2.5"
                    >
                      <div
                        className={`flex size-6 shrink-0 items-center justify-center rounded-md ${row.iconTone}`}
                      >
                        <Icon className="size-3" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div
                          className={`h-1.5 rounded-full bg-white/20 ${row.bar}`}
                        />
                        <div className="mt-1 h-1 w-1/2 rounded-full bg-white/10" />
                      </div>
                      <span className={`size-1.5 rounded-full ${row.dot}`} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
