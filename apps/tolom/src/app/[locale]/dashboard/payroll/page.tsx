"use client";

import { Calculator, CheckCircle2, ClipboardList, Users } from "lucide-react";
import { reportServerError } from "@/lib/sentry-report-server";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
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
  usePayRates,
  usePayRateUpsert,
  usePayrollRecords,
  useUpdatePayrollRecord,
} from "@/lib/queries/use-payroll";
import { useMechanics } from "@/lib/queries/use-reports";
import { useSelectedBranchId } from "@/lib/stores";
import { formatMNT } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  draft:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  approved: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  paid: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

interface MechanicRateRow {
  mechanicId: string;
  mechanicName: string;
  hourlyRate: number | null;
  effectiveFrom: string | null;
}

export default function PayrollPage() {
  const t = useTranslations();
  const commonT = useTranslations("common");
  const { data: org } = useCurrentOrg();
  const orgId = org?.orgId;
  const selectedBranchId = useSelectedBranchId();
  const branchFilter = selectedBranchId === "all" ? null : selectedBranchId;
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth() + 1);
  const now = new Date();
  const [editingRates, setEditingRates] = useState<Record<string, string>>({});
  const [savingRateId, setSavingRateId] = useState<string | null>(null);
  const [updatingRecordId, setUpdatingRecordId] = useState<string | null>(null);

  const mechanicsQuery = useMechanics(orgId, branchFilter);
  const ratesQuery = usePayRates(orgId, branchFilter);
  const recordsQuery = usePayrollRecords(orgId, year, month, branchFilter);

  const mechanics = mechanicsQuery.data ?? [];
  const payRates = ratesQuery.data ?? [];
  const records = recordsQuery.data ?? [];

  const upsertRate = usePayRateUpsert(orgId);
  const calculatePayroll = useCalculatePayroll(orgId, branchFilter);
  const updateRecord = useUpdatePayrollRecord(orgId, branchFilter);

  const pageError =
    (mechanicsQuery.error instanceof Error
      ? mechanicsQuery.error.message
      : null) ??
    (ratesQuery.error instanceof Error ? ratesQuery.error.message : null) ??
    (recordsQuery.error instanceof Error ? recordsQuery.error.message : null);

  const periodLabel = `${year}.${String(month).padStart(2, "0")}`;

  const mechanicRateRows = useMemo<MechanicRateRow[]>(() => {
    const rateMap = new Map(payRates.map((rate) => [rate.mechanic_id, rate]));
    const rows = mechanics.map((mechanic) => {
      const rate = rateMap.get(mechanic.id);

      return {
        mechanicId: mechanic.id,
        mechanicName: mechanic.full_name ?? commonT("unknown"),
        hourlyRate: rate?.hourly_rate ?? null,
        effectiveFrom: rate?.effective_from ?? null,
      };
    });

    for (const rate of payRates) {
      if (rows.some((row) => row.mechanicId === rate.mechanic_id)) continue;

      rows.push({
        mechanicId: rate.mechanic_id,
        mechanicName: rate.mechanic_name ?? commonT("unknown"),
        hourlyRate: rate.hourly_rate,
        effectiveFrom: rate.effective_from,
      });
    }

    return rows;
  }, [commonT, mechanics, payRates]);

  const configuredRatesCount = useMemo(
    () => mechanicRateRows.filter((row) => row.hourlyRate !== null).length,
    [mechanicRateRows],
  );

  const totalGrossPay = useMemo(
    () =>
      records.reduce((sum, record) => sum + Number(record.gross_pay ?? 0), 0),
    [records],
  );

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: `${i + 1}`,
  }));
  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  const handleSaveRate = async (mechanicId: string) => {
    const value = editingRates[mechanicId];
    if (!value || Number.isNaN(Number(value)) || Number(value) <= 0) return;

    const effectiveFrom = `${year}-${String(month).padStart(2, "0")}-01`;
    setSavingRateId(mechanicId);

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
    reportServerError("Unexpected error", err);
      toast.error(err instanceof Error ? err.message : t("payroll.saveFailed"));
    } finally {
      setSavingRateId(null);
    }
  };

  const handleCalculate = async () => {
    try {
      await calculatePayroll.mutateAsync({ year, month });
      toast.success(t("payroll.calculated"));
    } catch (err) {
    reportServerError("Unexpected error", err);
      toast.error(
        err instanceof Error ? err.message : t("payroll.calculationFailed"),
      );
    }
  };

  const handleApprove = async (recordId: string) => {
    setUpdatingRecordId(recordId);
    try {
      await updateRecord.mutateAsync({
        recordId,
        action: "approve",
        year,
        month,
      });
      toast.success(t("payroll.approvedMsg"));
    } catch (err) {
    reportServerError("Unexpected error", err);
      toast.error(
        err instanceof Error ? err.message : t("payroll.approvalFailed"),
      );
    } finally {
      setUpdatingRecordId(null);
    }
  };

  const handlePay = async (recordId: string) => {
    setUpdatingRecordId(recordId);
    try {
      await updateRecord.mutateAsync({
        recordId,
        action: "pay",
        year,
        month,
      });
      toast.success(t("payroll.paidMsg"));
    } catch (err) {
    reportServerError("Unexpected error", err);
      toast.error(
        err instanceof Error ? err.message : t("payroll.paymentFailed"),
      );
    } finally {
      setUpdatingRecordId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-8">
      <div className="rounded-3xl border border-border/60 bg-card p-5 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="rounded-full px-2.5 py-0.5">
                <Calculator className="mr-1 size-3.5" />
                {t("payroll.periodLabel", { period: periodLabel })}
              </Badge>
              {branchFilter && (
                <Badge variant="outline" className="rounded-full px-2.5 py-0.5">
                  {t("payroll.branchScoped")}
                </Badge>
              )}
            </div>
            <div>
              <Typography.H1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                {t("payroll.title")}
              </Typography.H1>
              <Typography.Muted className="mt-1 max-w-2xl text-sm text-muted-foreground">
                {t("payroll.subtitle")}
              </Typography.Muted>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={String(year)}
              onValueChange={(v) => setYear(Number(v))}
            >
              <SelectTrigger className="w-28 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((item) => (
                  <SelectItem key={item} value={String(item)}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={String(month)}
              onValueChange={(v) => setMonth(Number(v))}
            >
              <SelectTrigger className="w-24 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((item) => (
                  <SelectItem key={item.value} value={String(item.value)}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleCalculate}
              disabled={
                calculatePayroll.isPending || mechanicRateRows.length === 0
              }
              className="h-10 rounded-xl px-5"
            >
              {calculatePayroll.isPending
                ? commonT("updating")
                : t("payroll.calculate")}
            </Button>
          </div>
        </div>
      </div>

      {pageError && (
        <Alert variant="destructive">
          <AlertTitle>{commonT("somethingWentWrong")}</AlertTitle>
          <AlertDescription>{pageError}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/60 bg-muted/15 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">
              {t("payroll.activeMechanics")}
            </CardTitle>
            <CardDescription>
              {t("payroll.activeMechanicsDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Typography.Text className="text-3xl font-semibold tabular-nums">
              {mechanics.length}
            </Typography.Text>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-muted/15 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">
              {t("payroll.ratesConfigured")}
            </CardTitle>
            <CardDescription>
              {t("payroll.ratesConfiguredDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Typography.Text className="text-3xl font-semibold tabular-nums">
              {configuredRatesCount}
            </Typography.Text>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-muted/15 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">
              {t("payroll.payrollRecords")}
            </CardTitle>
            <CardDescription>{t("payroll.recordsDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Typography.Text className="text-3xl font-semibold tabular-nums">
              {records.length}
            </Typography.Text>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-muted/15 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">
              {t("payroll.grossPayroll")}
            </CardTitle>
            <CardDescription>{t("payroll.grossPayrollDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Typography.Text className="text-3xl font-semibold tabular-nums">
              {formatMNT(totalGrossPay)}
            </Typography.Text>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="gap-2 pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="size-4" />
            {t("payroll.payRates")}
          </CardTitle>
          <CardDescription>{t("payroll.payRatesDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          {mechanicsQuery.isPending || ratesQuery.isPending ? (
            <div className="flex flex-col gap-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          ) : mechanicRateRows.length === 0 ? (
            <Empty className="border border-dashed border-border/70 bg-muted/20">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Users />
                </EmptyMedia>
                <EmptyTitle>{t("payroll.noMechanics")}</EmptyTitle>
                <EmptyDescription>
                  {t("payroll.noMechanicsDesc")}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("payroll.mechanic")}</TableHead>
                  <TableHead>{t("payroll.currentRate")}</TableHead>
                  <TableHead>{t("payroll.hourlyRate")}</TableHead>
                  <TableHead>{t("payroll.effectiveFrom")}</TableHead>
                  <TableHead className="w-[120px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {mechanicRateRows.map((row) => {
                  const draftValue = editingRates[row.mechanicId] ?? "";
                  const isDirty =
                    draftValue !== "" && Number(draftValue) !== row.hourlyRate;
                  const isSaving = savingRateId === row.mechanicId;

                  return (
                    <TableRow key={row.mechanicId}>
                      <TableCell className="font-medium">
                        {row.mechanicName}
                      </TableCell>
                      <TableCell>
                        {row.hourlyRate !== null ? (
                          <Typography.Text className="font-medium">
                            {formatMNT(row.hourlyRate)}
                          </Typography.Text>
                        ) : (
                          <Badge variant="outline">{t("payroll.noRate")}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <CurrencyInput
                          value={Number(draftValue) || 0}
                          onChange={(val) =>
                            setEditingRates((prev) => ({
                              ...prev,
                              [row.mechanicId]: String(val),
                            }))
                          }
                          min={0}
                          className="h-9 w-32 rounded-xl"
                          placeholder={row.hourlyRate?.toString() ?? "0"}
                        />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {row.effectiveFrom ?? "\u2014"}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full rounded-xl"
                          onClick={() => handleSaveRate(row.mechanicId)}
                          disabled={!isDirty || upsertRate.isPending}
                        >
                          {isSaving ? commonT("saving") : t("payroll.save")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="gap-2 pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="size-4" />
            {t("payroll.payrollRecords")}
          </CardTitle>
          <CardDescription>{t("payroll.recordsDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          {recordsQuery.isPending ? (
            <div className="flex flex-col gap-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          ) : records.length === 0 ? (
            <Empty className="border border-dashed border-border/70 bg-muted/20">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ClipboardList />
                </EmptyMedia>
                <EmptyTitle>{t("payroll.noPayrollRecords")}</EmptyTitle>
                <EmptyDescription>
                  {t("payroll.noPayrollRecordsDesc")}
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
                  <TableHead className="w-[150px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => {
                  const isUpdating = updatingRecordId === record.id;

                  return (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {record.mechanic_name ?? commonT("unknown")}
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
                        <div className="flex justify-end gap-2">
                          {record.status === "draft" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-xl"
                              onClick={() => handleApprove(record.id)}
                              disabled={updateRecord.isPending}
                            >
                              {isUpdating
                                ? commonT("updating")
                                : t("payroll.approve")}
                            </Button>
                          )}
                          {record.status === "approved" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-xl"
                              onClick={() => handlePay(record.id)}
                              disabled={updateRecord.isPending}
                            >
                              {isUpdating
                                ? commonT("updating")
                                : t("payroll.markAsPaid")}
                            </Button>
                          )}
                          {record.status === "paid" && (
                            <Badge variant="outline" className="rounded-full">
                              <CheckCircle2 className="mr-1 size-3.5" />
                              {t("payroll.paid")}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
