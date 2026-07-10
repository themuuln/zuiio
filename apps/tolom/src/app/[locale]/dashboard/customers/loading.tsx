import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <table className="w-full">
      <thead>
        <tr className="border-b">
          <th className="h-10 px-4 text-left align-middle text-sm font-medium text-muted-foreground">
            <Skeleton className="h-4 w-10" />
          </th>
          <th className="hidden sm:table-cell h-10 px-4 text-left align-middle text-sm font-medium text-muted-foreground">
            <Skeleton className="h-4 w-14" />
          </th>
          <th className="h-10 px-4 text-center align-middle text-sm font-medium text-muted-foreground">
            <Skeleton className="mx-auto h-4 w-14" />
          </th>
          <th className="hidden md:table-cell h-10 px-4 text-left align-middle text-sm font-medium text-muted-foreground">
            <Skeleton className="h-4 w-16" />
          </th>
          <th className="hidden lg:table-cell h-10 px-4 text-left align-middle text-sm font-medium text-muted-foreground">
            <Skeleton className="h-4 w-12" />
          </th>
          <th className="w-10 h-10 px-4" />
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, i) => (
          <tr key={`row-${i}`} className="border-b">
            <td className="p-4 align-middle">
              <div className="flex items-center gap-2.5">
                <Skeleton className="size-8 shrink-0 rounded-lg" />
                <div className="flex flex-col gap-1.5 min-w-0">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-3.5 w-16" />
                </div>
              </div>
            </td>
            <td className="hidden sm:table-cell p-4 align-middle">
              <Skeleton className="h-4 w-28" />
            </td>
            <td className="p-4 align-middle text-center">
              <Skeleton className="mx-auto h-5 w-8 rounded-full" />
            </td>
            <td className="hidden md:table-cell p-4 align-middle">
              <Skeleton className="h-4 w-8" />
            </td>
            <td className="hidden lg:table-cell p-4 align-middle">
              <Skeleton className="h-4 w-20" />
            </td>
            <td className="p-4 align-middle">
              <Skeleton className="size-4" />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function CustomersLoading() {
  return (
    <div className="tablet-touch flex flex-col gap-6 tablet:gap-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-5 w-32" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>

      <Skeleton className="h-10 w-full" />

      <Card className="py-0">
        <CardContent className="p-0">
          <TableSkeleton />
        </CardContent>
      </Card>
    </div>
  );
}
