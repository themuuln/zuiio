import { Plus, Wrench } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export function EmptyDashboardState({ onRetry }: { onRetry: () => void }) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Wrench />
        </EmptyMedia>
        <EmptyTitle>Welcome to TOLOM</EmptyTitle>
        <EmptyDescription>
          Your garage&apos;s command center. Start by creating your first work
          order; revenue, customer stats, and trends will appear here
          automatically as you complete jobs.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className="flex gap-3">
          <Link href="/dashboard/work-orders/new">
            <Button>
              <Plus className="size-4" />
              Create Your First Work Order
            </Button>
          </Link>
          <Button variant="outline" onClick={onRetry}>
            Refresh
          </Button>
        </div>
      </EmptyContent>
    </Empty>
  );
}
