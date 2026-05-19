import { Plus, Wrench } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";

export function EmptyDashboardState({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="border-dashed border-2 py-16">
      <CardContent className="flex flex-col items-center gap-6">
        <div className="flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5">
          <Wrench className="size-10 text-primary/60" />
        </div>
        <div className="max-w-md text-center">
          <Typography.H4 className="m-0">Welcome to TOLOM</Typography.H4>
          <Typography.P className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Your garage&apos;s command center. Start by creating your first
            work order; revenue, customer stats, and trends will appear here
            automatically as you complete jobs.
          </Typography.P>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard/work-orders/new"
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-all duration-150 hover:bg-primary/90 hover:shadow-md active:scale-[0.98]"
          >
            <Plus className="size-4" />
            Create Your First Work Order
          </Link>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-150 hover:bg-muted hover:text-foreground"
          >
            Refresh
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
