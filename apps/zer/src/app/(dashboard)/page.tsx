import { Coin, Package, ShoppingCart } from "@phosphor-icons/react/dist/ssr";
import { Suspense } from "react";
import { HeroActionCard } from "@/components/dashboard/dashboard-cards";
import { getDashboardContext } from "@/lib/dashboard-context";
import { LowStockWrapper } from "./_sections/low-stock-wrapper";
import { MonthlyTrendSection } from "./_sections/monthly-trend-section";
import { QuickShortcuts } from "./_sections/quick-shortcuts";
import { RecentSales } from "./_sections/recent-sales";
import { TodayPulse } from "./_sections/today-pulse";

export default async function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="flex-1">
            <div className="flex flex-1 flex-col gap-6">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-3xl font-semibold tracking-tight">
                  Хяналтын самбар
                </h1>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="h-[104px] animate-pulse rounded-xl bg-muted" />
                <div className="h-[104px] animate-pulse rounded-xl bg-muted" />
                <div className="h-[104px] animate-pulse rounded-xl bg-muted" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="h-[72px] animate-pulse rounded-xl bg-muted" />
                <div className="h-[72px] animate-pulse rounded-xl bg-muted" />
                <div className="h-[72px] animate-pulse rounded-xl bg-muted" />
                <div className="h-[72px] animate-pulse rounded-xl bg-muted" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="h-[72px] animate-pulse rounded-xl bg-muted" />
                <div className="h-[72px] animate-pulse rounded-xl bg-muted" />
                <div className="h-[72px] animate-pulse rounded-xl bg-muted" />
                <div className="h-[72px] animate-pulse rounded-xl bg-muted" />
                <div className="h-[72px] animate-pulse rounded-xl bg-muted" />
                <div className="h-[72px] animate-pulse rounded-xl bg-muted" />
              </div>
              <div className="h-48 animate-pulse rounded-xl bg-muted" />
              <div className="h-80 animate-pulse rounded-xl bg-muted" />
            </div>
          </div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}

async function DashboardContent() {
  const { organizationId, branchId, isBranchScoped } =
    await getDashboardContext();

  return (
    <>
      <Suspense fallback={null}>
        <LowStockWrapper orgId={organizationId} />
      </Suspense>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex-1">
          <div className="flex flex-1 flex-col gap-6">
            {/* Page Header — static, no data */}
            <PageHeader />

            {/* Hero Action Cards — static, no data */}
            <HeroActions />

            {/* Today's Pulse — fetches KPIs */}
            <Suspense
              fallback={
                <div>
                  <h2 className="mb-3 text-sm font-medium text-muted-foreground">
                    Өнөөдрийн байдал
                  </h2>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="h-[72px] animate-pulse rounded-xl bg-muted" />
                    <div className="h-[72px] animate-pulse rounded-xl bg-muted" />
                    <div className="h-[72px] animate-pulse rounded-xl bg-muted" />
                    <div className="h-[72px] animate-pulse rounded-xl bg-muted" />
                  </div>
                </div>
              }
            >
              <TodayPulse
                orgId={organizationId}
                branchId={branchId}
                isBranchScoped={isBranchScoped}
              />
            </Suspense>

            {/* Quick Shortcuts — fetches aggregate counts */}
            <Suspense
              fallback={
                <div>
                  <h2 className="mb-3 text-sm font-medium text-muted-foreground">
                    Түргэн цэс
                  </h2>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="h-[72px] animate-pulse rounded-xl bg-muted" />
                    <div className="h-[72px] animate-pulse rounded-xl bg-muted" />
                    <div className="h-[72px] animate-pulse rounded-xl bg-muted" />
                    <div className="h-[72px] animate-pulse rounded-xl bg-muted" />
                    <div className="h-[72px] animate-pulse rounded-xl bg-muted" />
                    <div className="h-[72px] animate-pulse rounded-xl bg-muted" />
                  </div>
                </div>
              }
            >
              <QuickShortcuts orgId={organizationId} />
            </Suspense>

            {/* Recent Sales Table — fetches last 5 sales */}
            <Suspense
              fallback={
                <div className="h-48 animate-pulse rounded-xl bg-muted" />
              }
            >
              <RecentSales
                orgId={organizationId}
                branchId={branchId}
                isBranchScoped={isBranchScoped}
              />
            </Suspense>

            {/* Monthly Trend Chart — fetches 30-day trend */}
            <Suspense
              fallback={
                <div className="h-80 animate-pulse rounded-xl bg-muted" />
              }
            >
              <MonthlyTrendSection
                orgId={organizationId}
                branchId={branchId}
                isBranchScoped={isBranchScoped}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </>
  );
}

function PageHeader() {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Хяналтын самбар
        </h1>
        <p className="text-sm text-muted-foreground">
          Байгууллагын үндсэн үзүүлэлтүүд
        </p>
      </div>
    </div>
  );
}

function HeroActions() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <HeroActionCard
        href="/sales?create=true"
        icon={<ShoppingCart className="size-6" />}
        title="Шинэ борлуулалт"
        description="Борлуулалт бүртгэх"
      />
      <HeroActionCard
        href="/expenses?create=true"
        icon={<Coin className="size-6" />}
        title="Шинэ зарлага"
        description="Зарлагын бүртгэл"
      />
      <HeroActionCard
        href="/products"
        icon={<Package className="size-6" />}
        title="Шинэ бүтээгдэхүүн"
        description="Бүтээгдэхүүн нэмэх"
      />
    </div>
  );
}
