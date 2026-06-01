"use client";

import { ClipboardList, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Typography } from "@/components/ui/typography";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import {
  useCalculatePayroll,
  usePayRateUpsert,
  usePayRates,
  usePayrollRecords,
  useUpdatePayrollRecord,
} from "@/lib/queries/use-payroll";
import { formatMNT } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  approved: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  paid: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

export default function PayrollPage() {
  const t = useTranslations();
  const { data: org } = useCurrentOrg();
  const orgId = org?.orgId;
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [editingRates, setEditingRates] = useState<Record<string, string>>({});

  // ── Queries ──
  const { data: payRates = [], isPending: ratesLoading } = usePayRates(orgId);
  const { data: records = [], isPending: recordsLoading } = usePayrollRecords(orgId, year, month);

  // ── Mutations ──
  const upsertRate = usePayRateUpsert(orgId);
  const calculatePayroll = useCalculatePayroll(orgId);
  const updateRecord = useUpdatePayrollRecord(orgId);

  // ── Combine pay rates with profiles ──
  const ratesWithNames = useMemo(
    () =>
      payRates.map((r) => ({
        ...r,
        mechanic_name: (r as any).mechanic_name ?? "Unknown",
      })),
    [payRates],
  );

  const handleSaveRate = async (mechanicId: string) => {
    const value = editingRates[mechanicId];
    if (!value || isNaN(Number(value)) || Number(value) <= 0) return;
    const effectiveFrom = `${year}-${String(month).padStart(2, "0")}-01`;
    try {
      await upsertRate.mutateAsync({
        mechanicId,
        hourlyRate: Number(value),
        effectiveFrom,
      });
      toast.success(t("payroll.saved"));
      setEditingRates((prev) => {
        const next = { ...prev };
        delete next[mechanicId];
        return next;
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    }
  };

  const handleCalculate = async () => {
    try {
      await calculatePayroll.mutateAsync({ year, month });
      toast.success(t("payroll.calculated"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Calculation failed");
    }
  };

  const handleApprove = async (recordId: string) => {
    try {
      await updateRecord.mutateAsync({ recordId, action: "approve", year, month });
      toast.success(t("payroll.approvedMsg"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to approve");
    }
  };

  const handlePay = async (recordId: string) => {
    try {
      await updateRecord.mutateAsync({ recordId, action: "pay", year, month });
      toast.success(t("payroll.paidMsg"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to mark as paid");
    }
  };

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: `${i + 1}`,
  }));
  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  return (
    <div className="flex flex-col gap-8 pb-8">
      {/* ── Header ── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Typography.H2>{t("payroll.title")}</Typography.H2>
          <Typography.Muted className="mt-1">
            {t("payroll.subtitle")}
          </Typography.Muted>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={String(year)}
            onValueChange={(v) => setYear(Number(v))}
          >
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={String(month)}
            onValueChange={(v) => setMonth(Number(v))}
          >
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m.value} value={String(m.value)}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleCalculate}
            disabled={calculatePayroll.isPending}
          >
            {calculatePayroll.isPending
              ? "..."
              : t("payroll.calculate")}
          </Button>
        </div>
      </div>

      {/* ── Pay Rates Section ── */}
      <div>
        <Typography.H3 className="mb-4">{t("payroll.payRates")}</Typography.H3>
        {ratesLoading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : ratesWithNames.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Users />
              </EmptyMedia>
              <EmptyTitle>{t("payroll.noPayRates")}</EmptyTitle>
              <EmptyDescription>
                {t("payroll.noPayRatesDesc")}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("payroll.mechanic")}</TableHead>
                <TableHead>{t("payroll.hourlyRate")}</TableHead>
                <TableHead>{t("payroll.effectiveFrom")}</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ratesWithNames.map((rate) => (
                <TableRow key={rate.mechanic_id}>
                  <TableCell className="font-medium">
                    {rate.mechanic_name}
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.5"
                      min="0"
                      className="w-28 h-8"
                      placeholder={String(rate.hourly_rate)}
                      value={editingRates[rate.mechanic_id] ?? ""}
                      onChange={(e) =>
                        setEditingRates((prev) => ({
                          ...prev,
                          [rate.mechanic_id]: e.target.value,
                        }))
                      }
                    />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {rate.effective_from}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      onClick={() => handleSaveRate(rate.mechanic_id)}
                      disabled={
                        !editingRates[rate.mechanic_id] ||
                        upsertRate.isPending
                      }
                    >
                      {t("payroll.save")}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* ── Payroll Records Section ── */}
      <div>
        <Typography.H3 className="mb-4">
          {t("payroll.payrollRecords")}
        </Typography.H3>
        {recordsLoading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : records.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ClipboardList />
              </EmptyMedia>
              <EmptyTitle>
                {t("payroll.noPayRates")}
              </EmptyTitle>
              <EmptyDescription>
                {t("payroll.noPayRatesDesc")}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("payroll.mechanic")}</TableHead>
                <TableHead>{t("payroll.totalHours")}</TableHead>
                <TableHead>{t("payroll.hourlyRate")}</TableHead>
                <TableHead>{t("payroll.grossPay")}</TableHead>
                <TableHead>{t("payroll.status")}</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">
                    {record.mechanic_name}
                  </TableCell>
                  <TableCell>{record.total_hours}</TableCell>
                  <TableCell>{formatMNT(record.hourly_rate)}</TableCell>
                  <TableCell className="font-semibold">
                    {formatMNT(record.gross_pay)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        STATUS_STYLES[record.status] ??
                        "bg-gray-100 text-gray-700"
                      }
                      variant="secondary"
                    >
                      {t(`payroll.${record.status}`)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {record.status === "draft" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApprove(record.id)}
                          disabled={updateRecord.isPending}
                        >
                          {t("payroll.approve")}
                        </Button>
                      )}
                      {record.status === "approved" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePay(record.id)}
                          disabled={updateRecord.isPending}
                        >
                          {t("payroll.markAsPaid")}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
