import type { ReactNode } from "react";
import { AdminTableSkeleton } from "@/components/admin/admin-skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

interface AdminPageLayoutProps {
  title: string;
  children: ReactNode;
  /** Items to render in the header's flex-end area (buttons, filters). */
  actions?: ReactNode;
  /** Section below the header area, before Card body. */
  headerExtras?: ReactNode;
  /** True while the list query is loading. */
  loading?: boolean;
  /** True when data is empty (shows empty state instead of children). */
  isEmpty?: boolean;
  /** Title for the empty state. Default: "No data" */
  emptyTitle?: string;
  /** Description for the empty state. */
  emptyDescription?: string;
}

/**
 * Standard admin page layout — Card header with title + actions, then
 * Card body with loading/empty/content states.
 */
export function AdminPageLayout({
  title,
  children,
  actions,
  headerExtras,
  loading,
  isEmpty,
  emptyTitle = "No data",
  emptyDescription,
}: AdminPageLayoutProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-2xl font-bold">{title}</CardTitle>
          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </CardHeader>
        {headerExtras && <div className="px-6 pb-4">{headerExtras}</div>}
        <CardContent>
          {loading ? (
            <AdminTableSkeleton rows={5} />
          ) : isEmpty ? (
            <Empty>
              <EmptyMedia variant="icon" />
              <EmptyHeader>
                <EmptyTitle>{emptyTitle}</EmptyTitle>
                {emptyDescription && (
                  <EmptyDescription>{emptyDescription}</EmptyDescription>
                )}
              </EmptyHeader>
            </Empty>
          ) : (
            children
          )}
        </CardContent>
      </Card>
    </div>
  );
}
