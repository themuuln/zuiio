import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export async function OnboardingChecklist({
  orgId,
  totalProducts,
}: {
  orgId: string;
  totalProducts: number;
}) {
  const supabase = await createClient();

  const [salesCountResult, profilesCountResult] = await Promise.all([
    supabase
      .from("sales")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId),
  ]);

  const hasProducts = totalProducts > 0;
  const hasSales = (salesCountResult.count ?? 0) > 0;
  const hasTeam = (profilesCountResult.count ?? 0) > 1;

  const checklistItems = [
    { label: "Бүтээгдэхүүн нэмэх", done: hasProducts, href: "/products" },
    {
      label: "Анхны борлуулалт хийх",
      done: hasSales,
      href: "/sales?create=true",
    },
    {
      label: "Хамтрагчдаа урих",
      done: hasTeam,
      href: "/settings/users",
    },
  ];

  const completedCount = checklistItems.filter((i) => i.done).length;
  const allDone = completedCount === checklistItems.length;

  if (allDone) return null;

  return (
    <aside className="w-full shrink-0 lg:w-64">
      <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-xs">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Эхлэх алхамууд</h3>
          <span className="text-xs text-muted-foreground">
            {completedCount}/{checklistItems.length}
          </span>
        </div>
        <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{
              width: `${(completedCount / checklistItems.length) * 100}%`,
            }}
          />
        </div>
        <div className="space-y-1">
          {checklistItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent",
                item.done && "text-muted-foreground",
              )}
            >
              {item.done ? (
                <svg
                  className="size-4 shrink-0 text-emerald-600"
                  viewBox="0 0 256 256"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24Zm45.66 85.66-56 56a8 8 0 0 1-11.32 0l-24-24a8 8 0 0 1 11.32-11.32L112 148.69l50.34-50.35a8 8 0 0 1 11.32 11.32Z" />
                </svg>
              ) : (
                <span className="block size-4 shrink-0 rounded-full border-2 border-muted-foreground" />
              )}
              <span className={cn(item.done && "line-through")}>
                {item.label}
              </span>
            </a>
          ))}
        </div>
      </div>
    </aside>
  );
}
