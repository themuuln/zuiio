import { Car, Plus, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { SectionHeader } from "./_section-header";

const QUICK_ACTIONS_CONFIG = [
  {
    href: "/dashboard/work-orders/new",
    icon: Plus,
    label: "New Work Order",
    desc: "Create a repair job for a customer",
    accent:
      "from-blue-500/20 to-blue-500/5 border-blue-200/30 hover:border-blue-300/50",
    iconBg: "bg-blue-100 text-blue-600",
  },
  {
    href: "/dashboard/customers/new",
    icon: Users,
    label: "New Customer",
    desc: "Add a customer to your roster",
    accent:
      "from-violet-500/20 to-violet-500/5 border-violet-200/30 hover:border-violet-300/50",
    iconBg: "bg-violet-100 text-violet-600",
  },
  {
    href: "/dashboard/vehicles/new",
    icon: Car,
    label: "New Vehicle",
    desc: "Register a vehicle in the system",
    accent:
      "from-amber-500/20 to-amber-500/5 border-amber-200/30 hover:border-amber-300/50",
    iconBg: "bg-amber-100 text-amber-600",
  },
  {
    href: "/dashboard/reports",
    icon: TrendingUp,
    label: "View Reports",
    desc: "Analytics and business performance",
    accent:
      "from-emerald-500/20 to-emerald-500/5 border-emerald-200/30 hover:border-emerald-300/50",
    iconBg: "bg-emerald-100 text-emerald-600",
  },
];

export function QuickActions({ t }: { t: (key: string) => string }) {
  return (
    <div>
      <SectionHeader title={t("dashboard.quickActions")} />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {QUICK_ACTIONS_CONFIG.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className={`group relative overflow-hidden rounded-xl border bg-gradient-to-br p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${action.accent}`}
            >
              <div
                className={`mb-3 flex size-10 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-110 ${action.iconBg}`}
              >
                <Icon className="size-5" />
              </div>
              <p className="font-semibold text-sm">{action.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {action.desc}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
