/**
 * Budget management service
 */

export interface Budget {
  id: string;
  organization_id: string;
  name: string;
  category: string | null;
  amount: number;
  period: string;
  start_date: string;
  end_date: string;
  alert_threshold: number;
  spent: number;
  created_at: string;
}

export interface BudgetSummary {
  budget: Budget;
  spent: number;
  remaining: number;
  percentage: number;
  isOverBudget: boolean;
  isNearLimit: boolean;
  daysLeft: number;
  dailyBurnRate: number;
  projectedTotal: number;
}

export function calculateBudgetSummary(budget: Budget): BudgetSummary {
  const spent = budget.spent;
  const remaining = budget.amount - spent;
  const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

  const now = new Date();
  const startDate = new Date(budget.start_date);
  const endDate = new Date(budget.end_date);
  const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  const daysPassed = Math.max(0, Math.min(totalDays, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))));
  const daysLeft = Math.max(0, totalDays - daysPassed);

  const dailyBurnRate = daysPassed > 0 ? spent / daysPassed : 0;
  const projectedTotal = dailyBurnRate * totalDays;

  return { budget, spent, remaining, percentage, isOverBudget: spent > budget.amount, isNearLimit: percentage >= budget.alert_threshold, daysLeft, dailyBurnRate, projectedTotal };
}

export function getBudgetStatusColor(percentage: number): "default" | "warning" | "destructive" {
  if (percentage >= 100) return "destructive";
  if (percentage >= 80) return "warning";
  return "default";
}

export function formatBudgetPeriod(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const startMonth = start.toLocaleDateString("mn-MN", { month: "short" });
  const endMonth = end.toLocaleDateString("mn-MN", { month: "short" });
  const year = start.getFullYear();
  if (startMonth === endMonth) return `${startMonth} ${year}`;
  return `${startMonth} - ${endMonth} ${year}`;
}
