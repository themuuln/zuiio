import { Check, Pencil, Target, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";

export function GoalCard({
  dailyGoal,
  totalRevenue,
  editingGoal,
  goalInput,
  settingsLoading,
  isPending,
  onGoalInputChange,
  onSave,
  onCancel,
  onEdit,
}: {
  dailyGoal: number;
  totalRevenue: number;
  editingGoal: boolean;
  goalInput: string;
  settingsLoading: boolean;
  isPending: boolean;
  onGoalInputChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onEdit: () => void;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {editingGoal ? (
          <div className="flex items-center gap-2 p-4">
            <Target className="size-4 shrink-0 text-muted-foreground" />
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                ₮
              </span>
              <input
                type="number"
                value={goalInput}
                onChange={(e) => onGoalInputChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onSave()}
                className="flex h-10 w-full rounded-md border border-input bg-background pl-7 pr-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Enter daily revenue goal"
                min={0}
              />
            </div>
            <Button
              size="sm"
              onClick={onSave}
              disabled={isPending}
              aria-label="Save goal"
            >
              <Check className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              aria-label="Cancel"
            >
              <X className="size-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <Target className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Daily Goal</p>
                {settingsLoading ? (
                  <Skeleton className="mt-1 h-6 w-24" />
                ) : (
                  <p className="text-lg font-semibold tabular-nums">
                    {dailyGoal > 0
                      ? formatCurrency(dailyGoal)
                      : "Not set"}
                  </p>
                )}
              </div>
            </div>
            {dailyGoal > 0 && totalRevenue > 0 && (
              <div className="flex flex-col items-end gap-1">
                <div className="flex h-7 items-center gap-2 rounded-lg bg-muted px-3 text-sm font-semibold tabular-nums">
                  <span className="text-emerald-600">
                    {formatCurrency(totalRevenue)}
                  </span>
                  <span className="text-muted-foreground">/</span>
                  <span>{formatCurrency(dailyGoal)}</span>
                </div>
                <div className="flex h-1.5 w-32 overflow-hidden rounded-full bg-muted">
                  <div
                    className="rounded-full bg-primary transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.round((totalRevenue / dailyGoal) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={onEdit}
              aria-label="Set daily goal"
            >
              <Pencil className="size-3.5" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
