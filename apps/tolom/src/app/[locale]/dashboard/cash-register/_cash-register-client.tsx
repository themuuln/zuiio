"use client";

import {
  ArrowDownCircle,
  ArrowUpCircle,
  Banknote,
  CheckCircle2,
  DollarSign,
  Loader2,
  MinusCircle,
  PlusCircle,
  Receipt,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Controller } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CurrencyInput } from "@/components/ui/currency-input";
import { DetailDrawer } from "@/components/ui/detail-drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import { useIsFirstLoad } from "@/hooks/use-is-first-load";
import { useForm, zodResolver } from "@/lib/hooks/use-form";
import {
  useCashOut,
  useCloseSession,
  useCurrentSession,
  useOpenSession,
} from "@/lib/queries/use-cash-register";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { reportServerError } from "@/lib/sentry-report-server";
import { useSelectedBranchId } from "@/lib/stores";
import { formatCurrency } from "@/lib/utils";

// ── Main Client Component ──────────────────────────────────

export function CashRegisterClient() {
  const t = useTranslations() as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const { data: org, isPending: orgLoading } = useCurrentOrg();
  const orgId = org?.orgId;
  const selectedBranchId = useSelectedBranchId();
  const branchFilter = selectedBranchId === "all" ? null : selectedBranchId;

  const { data: session, isPending: sessionLoading } = useCurrentSession(
    orgId,
    branchFilter,
  );

  const [showOpenDialog, setShowOpenDialog] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [showCashOutDialog, setShowCashOutDialog] = useState(false);
  const isFirstLoad = useIsFirstLoad(!!session);

  const isPending = orgLoading || sessionLoading;
  const showSkeleton = isPending && isFirstLoad;

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Banknote className="size-5 text-primary" />
          <Typography.H2 className="m-0 text-xl font-semibold">
            {t("cashRegister.title")}
          </Typography.H2>
        </div>
        {!session && (
          <Button onClick={() => setShowOpenDialog(true)}>
            <PlusCircle className="mr-1.5 size-3.5" />
            {t("cashRegister.openSession")}
          </Button>
        )}
      </div>

      <Separator />

      {/* Status + Actions */}
      {showSkeleton ? (
        <>
          <Skeleton className="h-16 rounded-xl" />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map((n) => (
              <Skeleton key={n} className="h-24 rounded-xl" />
            ))}
          </div>
        </>
      ) : session ? (
        <SessionHeader
          session={session}
          onClose={() => setShowCloseDialog(true)}
          onCashOut={() => setShowCashOutDialog(true)}
        />
      ) : (
        <NoSessionCard onOpen={() => setShowOpenDialog(true)} />
      )}

      {/* Transaction List */}
      {showSkeleton ? (
        <Skeleton className="h-48 rounded-xl" />
      ) : session?.entries && session.entries.length > 0 ? (
        <TransactionList entries={session.entries} />
      ) : null}

      {/* Dialogs */}
      <OpenSessionDialog
        open={showOpenDialog}
        onOpenChange={setShowOpenDialog}
        orgId={orgId}
        branchId={branchFilter}
      />
      {session && (
        <>
          <CloseSessionDialog
            open={showCloseDialog}
            onOpenChange={setShowCloseDialog}
            orgId={orgId}
            session={session}
          />
          <CashOutDialog
            open={showCashOutDialog}
            onOpenChange={setShowCashOutDialog}
            orgId={orgId}
            sessionId={session.id}
          />
        </>
      )}
    </div>
  );
}

// ── Session Header ─────────────────────────────────────────

function SessionHeader({
  session,
  onClose,
  onCashOut,
}: {
  session: NonNullable<ReturnType<typeof useCurrentSession>["data"]>;
  onClose: () => void;
  onCashOut: () => void;
}) {
  const t = useTranslations() as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;

  const expectedBalance =
    session.expected_balance ??
    session.opening_balance + session.cash_in - session.cash_out;

  return (
    <div className="flex flex-col gap-4">
      {/* Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle2 className="size-4 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <Typography.Text className="font-medium">
              {t("cashRegister.sessionOpen")}
            </Typography.Text>
            <Typography.Muted className="text-xs">
              {t("cashRegister.openedAt")}{" "}
              {new Date(session.opened_at).toLocaleTimeString()}
            </Typography.Muted>
          </div>
        </div>
        <Badge
          variant="secondary"
          className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
        >
          {session.entries.length} transaction
          {session.entries.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <BalanceCard
          icon={DollarSign}
          label={t("cashRegister.openingBalance")}
          value={session.opening_balance}
          accent="text-muted-foreground"
        />
        <BalanceCard
          icon={ArrowDownCircle}
          label={t("cashRegister.cashIn")}
          value={session.cash_in}
          accent="text-green-500"
        />
        <BalanceCard
          icon={ArrowUpCircle}
          label={t("cashRegister.cashOut")}
          value={session.cash_out}
          accent="text-red-500"
        />
        <BalanceCard
          icon={Receipt}
          label={t("cashRegister.expectedBalance")}
          value={expectedBalance}
          accent="text-blue-500"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="outline" onClick={onCashOut}>
          <MinusCircle className="mr-1.5 size-3.5" />
          {t("cashRegister.addCashOut")}
        </Button>
        <Button
          className="bg-green-600 text-white hover:bg-green-700"
          onClick={onClose}
        >
          <CheckCircle2 className="mr-1.5 size-3.5" />
          {t("cashRegister.closeSession")}
        </Button>
      </div>
    </div>
  );
}

// ── Balance Card ───────────────────────────────────────────

function BalanceCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1.5 p-4">
        <div className="flex items-center gap-2">
          <Icon className={`size-4 ${accent ?? "text-muted-foreground"}`} />
          <Typography.Muted className="text-xs">{label}</Typography.Muted>
        </div>
        <Typography.H3 className="m-0 text-2xl font-bold tracking-tight">
          {formatCurrency(value)}
        </Typography.H3>
      </CardContent>
    </Card>
  );
}

// ── Transaction List ───────────────────────────────────────

function TransactionList({
  entries,
}: {
  entries: NonNullable<ReturnType<typeof useCurrentSession>["data"]>["entries"];
}) {
  const t = useTranslations() as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;

  return (
    <Card>
      <CardContent className="p-4">
        <Typography.Text className="mb-3 text-sm font-semibold">
          {t("cashRegister.entries")}
        </Typography.Text>
        <div className="flex flex-col gap-2">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex size-7 items-center justify-center rounded-full ${
                    entry.entry_type === "in"
                      ? "bg-green-100 dark:bg-green-900/30"
                      : "bg-red-100 dark:bg-red-900/30"
                  }`}
                >
                  {entry.entry_type === "in" ? (
                    <ArrowDownCircle className="size-3.5 text-green-600 dark:text-green-400" />
                  ) : (
                    <ArrowUpCircle className="size-3.5 text-red-600 dark:text-red-400" />
                  )}
                </div>
                <div>
                  <Typography.Text className="text-sm">
                    {entry.description ?? entry.source}
                  </Typography.Text>
                  <Typography.Muted className="text-xs">
                    {new Date(entry.created_at).toLocaleTimeString()} ·{" "}
                    {(entry.source ?? "").replace("_", " ")}
                  </Typography.Muted>
                </div>
              </div>
              <Typography.Text
                className={`text-sm font-medium tabular-nums ${
                  entry.entry_type === "in"
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {entry.entry_type === "in" ? "+" : "-"}
                {formatCurrency(entry.amount)}
              </Typography.Text>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── No Session Card ────────────────────────────────────────

function NoSessionCard({ onOpen }: { onOpen: () => void }) {
  const t = useTranslations() as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-12">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <Banknote className="size-6 text-muted-foreground" />
        </div>
        <div className="text-center">
          <Typography.Text className="font-medium">
            {t("cashRegister.noSession")}
          </Typography.Text>
          <Typography.Muted className="text-sm">
            Open the cash register to start tracking today's cash transactions.
          </Typography.Muted>
        </div>
        <Button onClick={onOpen}>
          <PlusCircle className="mr-1.5 size-3.5" />
          {t("cashRegister.openSession")}
        </Button>
      </CardContent>
    </Card>
  );
}

// ── Open Session Dialog ────────────────────────────────────

const openSessionSchema = z.object({
  balance: z.number().min(0, "Balance must be at least 0"),
});

type OpenSessionValues = z.infer<typeof openSessionSchema>;

function OpenSessionDialog({
  open,
  onOpenChange,
  orgId,
  branchId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string | undefined;
  branchId: string | null;
}) {
  const t = useTranslations() as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const form = useForm<OpenSessionValues>({
    resolver: zodResolver(openSessionSchema),
    defaultValues: { balance: 0 },
  });
  const balance = form.watch("balance");
  const openSession = useOpenSession(orgId);
  const formId = "open-session-form";

  return (
    <DetailDrawer open={open} onOpenChange={onOpenChange} size="lg">
      <DetailDrawer.Header>
        <DetailDrawer.Title>{t("cashRegister.openSession")}</DetailDrawer.Title>
      </DetailDrawer.Header>
      <DetailDrawer.Body>
        <form
          id={formId}
          onSubmit={form.handleSubmit(async (data) => {
            try {
              await openSession.mutateAsync(
                { opening_balance: data.balance, branch_id: branchId },
                {
                  onSuccess: () => {
                    onOpenChange(false);
                    form.reset();
                  },
                },
              );
            } catch (err) {
              reportServerError("Unexpected error", err);
              toast.error(
                err instanceof Error
                  ? err.message
                  : t("common.unexpectedError"),
              );
            }
          })}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="opening-balance">
              {t("cashRegister.openingBalance")}
            </Label>
            <Controller
              control={form.control}
              name="balance"
              render={({ field }) => (
                <CurrencyInput
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  min={0}
                  placeholder="₮ 0"
                  showPrefix={false}
                  aria-label={t("cashRegister.openingBalance")}
                />
              )}
            />
            <Typography.Muted className="text-xs">
              Count the cash in the drawer and enter the amount.
            </Typography.Muted>
          </div>
        </form>
      </DetailDrawer.Body>
      <DetailDrawer.Footer>
        <DetailDrawer.FooterActions>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            form={formId}
            disabled={openSession.isPending || balance === 0}
            className="flex-1"
          >
            {openSession.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {t("common.saving")}
              </>
            ) : (
              <>
                <CheckCircle2 className="size-4" />
                {t("cashRegister.openSession")}
              </>
            )}
          </Button>
        </DetailDrawer.FooterActions>
      </DetailDrawer.Footer>
    </DetailDrawer>
  );
}

// ── Close Session Dialog ───────────────────────────────────

const closeSessionSchema = z.object({
  balance: z.number().min(0, "Balance must be at least 0"),
  note: z.string(),
});

type CloseSessionValues = z.infer<typeof closeSessionSchema>;

function CloseSessionDialog({
  open,
  onOpenChange,
  orgId,
  session,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string | undefined;
  session: NonNullable<ReturnType<typeof useCurrentSession>["data"]>;
}) {
  const t = useTranslations() as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const form = useForm<CloseSessionValues>({
    resolver: zodResolver(closeSessionSchema),
    defaultValues: { balance: 0, note: "" },
  });
  const balanceValue = form.watch("balance");
  const closeSession = useCloseSession(orgId);
  const formId = "close-session-form";

  const expectedBalance =
    session.expected_balance ??
    session.opening_balance + session.cash_in - session.cash_out;
  const discrepancy = balanceValue - expectedBalance;
  const _hasDiscrepancy = balanceValue > 0 && discrepancy !== 0;

  return (
    <DetailDrawer open={open} onOpenChange={onOpenChange} size="lg">
      <DetailDrawer.Header>
        <DetailDrawer.Title>
          {t("cashRegister.closeSession")}
        </DetailDrawer.Title>
      </DetailDrawer.Header>
      <DetailDrawer.Body>
        {/* Summary before closing */}
        <div className="rounded-lg border bg-muted/50 p-3 text-sm mb-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {t("cashRegister.openingBalance")}
            </span>
            <span className="font-medium">
              {formatCurrency(session.opening_balance)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {t("cashRegister.cashIn")}
            </span>
            <span className="font-medium text-green-600 dark:text-green-400">
              +{formatCurrency(session.cash_in)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {t("cashRegister.cashOut")}
            </span>
            <span className="font-medium text-red-600 dark:text-red-400">
              -{formatCurrency(session.cash_out)}
            </span>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between">
            <span className="font-medium">
              {t("cashRegister.expectedBalance")}
            </span>
            <span className="font-bold">{formatCurrency(expectedBalance)}</span>
          </div>
        </div>

        <form
          id={formId}
          onSubmit={form.handleSubmit(async (data) => {
            try {
              await closeSession.mutateAsync(
                {
                  sessionId: session.id,
                  closing_balance: data.balance,
                  note: data.note || null,
                },
                {
                  onSuccess: () => {
                    onOpenChange(false);
                    form.reset();
                  },
                },
              );
            } catch (err) {
              reportServerError("Unexpected error", err);
              toast.error(
                err instanceof Error
                  ? err.message
                  : t("common.unexpectedError"),
              );
            }
          })}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="closing-balance">
              {t("cashRegister.closingBalance")}
            </Label>
            <Controller
              control={form.control}
              name="balance"
              render={({ field }) => (
                <CurrencyInput
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  min={0}
                  placeholder="₮ 0"
                  showPrefix={false}
                  aria-label={t("cashRegister.closingBalance")}
                />
              )}
            />
            <Typography.Muted className="text-xs">
              Count the cash in the drawer and enter the actual amount.
            </Typography.Muted>
          </div>

          {/* Live discrepancy preview */}
          {balanceValue > 0 && (
            <div
              className={`rounded-lg border p-3 text-sm ${
                discrepancy === 0
                  ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30"
                  : discrepancy > 0
                    ? "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30"
                    : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30"
              }`}
            >
              <div className="flex justify-between">
                <span className="font-medium">
                  {t("cashRegister.discrepancy")}
                </span>
                <span
                  className={`font-bold ${
                    discrepancy === 0
                      ? "text-green-600 dark:text-green-400"
                      : discrepancy > 0
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {discrepancy === 0
                    ? t("cashRegister.balanced")
                    : `${discrepancy > 0 ? "+" : ""}${formatCurrency(discrepancy)} ${
                        discrepancy > 0
                          ? t("cashRegister.over")
                          : t("cashRegister.short")
                      }`}
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="discrepancy-note">
              {t("cashRegister.discrepancyNote")}
            </Label>
            <Textarea
              id="discrepancy-note"
              {...form.register("note")}
              placeholder={t("cashRegister.discrepancyNotePlaceholder")}
              rows={2}
            />
          </div>
        </form>
      </DetailDrawer.Body>
      <DetailDrawer.Footer>
        <DetailDrawer.FooterActions>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            form={formId}
            disabled={closeSession.isPending || balanceValue === 0}
            className="flex-1"
          >
            {closeSession.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {t("common.saving")}
              </>
            ) : (
              <>
                <CheckCircle2 className="size-4" />
                {t("cashRegister.closeSession")}
              </>
            )}
          </Button>
        </DetailDrawer.FooterActions>
      </DetailDrawer.Footer>
    </DetailDrawer>
  );
}

// ── Cash Out Drawer ────────────────────────────────────────

const cashOutSchema = z.object({
  amount: z.number().min(1, "Amount must be at least 1"),
  description: z.string().trim().min(1, "Description is required"),
});

type CashOutValues = z.infer<typeof cashOutSchema>;

function CashOutDialog({
  open,
  onOpenChange,
  orgId,
  sessionId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string | undefined;
  sessionId: string;
}) {
  const t = useTranslations() as (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  const form = useForm<CashOutValues>({
    resolver: zodResolver(cashOutSchema),
    defaultValues: { amount: 0, description: "" },
  });
  const amount = form.watch("amount");
  const description = form.watch("description");
  const cashOut = useCashOut(orgId);
  const formId = "cash-out-form";

  return (
    <DetailDrawer open={open} onOpenChange={onOpenChange} size="lg">
      <DetailDrawer.Header>
        <DetailDrawer.Title>{t("cashRegister.addCashOut")}</DetailDrawer.Title>
      </DetailDrawer.Header>
      <DetailDrawer.Body>
        <form
          id={formId}
          onSubmit={form.handleSubmit(async (data) => {
            try {
              await cashOut.mutateAsync(
                {
                  sessionId,
                  amount: data.amount,
                  description: data.description.trim(),
                },
                {
                  onSuccess: () => {
                    onOpenChange(false);
                    form.reset();
                  },
                },
              );
            } catch (err) {
              reportServerError("Unexpected error", err);
              toast.error(
                err instanceof Error
                  ? err.message
                  : t("common.unexpectedError"),
              );
            }
          })}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="cashout-amount">
              {t("cashRegister.cashOutAmount")}
            </Label>
            <Controller
              control={form.control}
              name="amount"
              render={({ field }) => (
                <CurrencyInput
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  min={1}
                  placeholder="₮ 0"
                  showPrefix={false}
                  aria-label={t("cashRegister.cashOutAmount")}
                />
              )}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="cashout-description">
              {t("cashRegister.cashOutDescription")}
            </Label>
            <Input
              id="cashout-description"
              {...form.register("description")}
              placeholder={t("cashRegister.cashOutDescriptionPlaceholder")}
            />
          </div>
        </form>
      </DetailDrawer.Body>
      <DetailDrawer.Footer>
        <DetailDrawer.FooterActions>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            form={formId}
            disabled={cashOut.isPending || amount <= 0 || !description.trim()}
            className="flex-1"
          >
            {cashOut.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {t("common.saving")}
              </>
            ) : (
              <>
                <MinusCircle className="size-4" />
                {t("cashRegister.addCashOut")}
              </>
            )}
          </Button>
        </DetailDrawer.FooterActions>
      </DetailDrawer.Footer>
    </DetailDrawer>
  );
}
