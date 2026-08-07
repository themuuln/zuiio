import { Skeleton } from "@/components/ui/skeleton";

function SidebarSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-md px-3 py-2">
      <Skeleton className="h-4 w-4" />
      <Skeleton className="h-4 flex-1" />
    </div>
  );
}

function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-4 border-b border-border px-4 py-4 last:border-b-0">
      <Skeleton className="h-4 flex-[2]" />
      <Skeleton className="h-4 flex-1" />
      <Skeleton className="h-4 flex-1" />
      <Skeleton className="h-4 flex-1" />
      <Skeleton className="h-8 w-16" />
    </div>
  );
}

const NAV_ITEMS = Array.from({ length: 8 }, (_, i) => i);
const TABLE_ROWS = Array.from({ length: 5 }, (_, i) => i);

export default function AdminLoading() {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar skeleton */}
      <div className="hidden w-64 border-r border-border md:flex md:flex-col">
        <div className="flex h-14 items-center border-b border-border px-4">
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="flex-1 space-y-1 p-3">
          {NAV_ITEMS.map((i) => (
            <SidebarSkeleton key={i} />
          ))}
        </div>
      </div>

      {/* Main area */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <div className="flex h-14 items-center border-b border-border px-4">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="ml-auto flex items-center gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 overflow-auto pt-14">
          <div className="p-6">
            <div className="space-y-6">
              {/* Title + actions */}
              <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-40" />
                <Skeleton className="h-10 w-28" />
              </div>

              {/* Table skeleton */}
              <div className="rounded-lg border border-border">
                <div className="border-b border-border p-4">
                  <div className="flex gap-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
                {TABLE_ROWS.map((i) => (
                  <TableRowSkeleton key={i} />
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
