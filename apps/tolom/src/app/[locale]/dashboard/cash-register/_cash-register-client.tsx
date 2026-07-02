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
import { useCallback, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import {
  useCashOut,
  useCloseSession,
  useCurrentSession,
  useOpenSession,
} from "@/lib/queries/use-cash-register";
import { useCurrentOrg } from "@/lib/queries/use-organization";
import { useSelectedBranchId } from "@/lib/stores";
import { formatCurrency } from "@/lib/utils";

// ── Main Client Component ──────────────────────────────────

export function CashRegisterClient() {
  const t = useTranslations();
  const { data: org, isPending: orgLoading } = useCurrentOrg();
  const orgId = org?.orgId;
  const selectedBranchId = useSelectedBranchId();
  const branchFilter = selectedBranchId === "all" ? null : selectedBranchId;

  const { data: session, isLoading: sessionLoading } = useCurrentSession(
    orgId,
    branchFilter,
  );

  const [showOpenDialog, setShowOpenDialog] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [showCashOutDialog, setShowCashOutDialog] = useState(false);

  const isLoading = orgLoading || sessionLoading;

  if (isLoading) {
    return <PageSkeleton />;
  }

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
      {session ? (
        <SessionHeader
          session={session}
          onClose={() => setShowCloseDialog(true)}
          onCashOut={() => setShowCashOutDialog(true)}
        />
      ) : (
        <NoSessionCard onOpen={() => setShowOpenDialog(true)} />
      )}

      {/* Transaction List */}
      {session?.entries && session.entries.length > 0 && (
        <TransactionList entries={session.entries} />
      )}

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
  const t = useTranslations();

  const expectedBalance =
    session.expected_balance ??
    session.opening_balance + session.cash_in - session.cash_out;

  return (
    <div className="flex flex-col gap-4">
      {/* Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <Typography.Text className="font-medium">
              {t("cashRegister.sessionOpen")}
            </Typography.Text>
            <Typography.Muted className="text-xs">
              Opened {new Date(session.opened_at).toLocaleTimeString()}
            </Typography.Muted>
          </div>
        </div>
        <Badge
          variant="secondary"
          className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
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
          accent="text-emerald-500"
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
          className="bg-emerald-600 text-white hover:bg-emerald-700"
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
  const t = useTranslations();

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
                      ? "bg-emerald-100 dark:bg-emerald-900/30"
                      : "bg-red-100 dark:bg-red-900/30"
                  }`}
                >
                  {entry.entry_type === "in" ? (
                    <ArrowDownCircle className="size-3.5 text-emerald-600 dark:text-emerald-400" />
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
                    {entry.source.replace("_", " ")}
                  </Typography.Muted>
                </div>
              </div>
              <Typography.Text
                className={`text-sm font-medium tabular-nums ${
                  entry.entry_type === "in"
                    ? "text-emerald-600 dark:text-emerald-400"
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
  const t = useTranslations();

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
  const t = useTranslations();
  const [balance, setBalance] = useState("");
  const openSession = useOpenSession(orgId);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const amount = Number(balance);
      if (Number.isNaN(amount) || amount < 0) return;

      await openSession.mutateAsync(
        { opening_balance: amount, branch_id: branchId },
        {
          onSuccess: () => {
            onOpenChange(false);
            setBalance("");
          },
        },
      );
    },
    [balance, branchId, onOpenChange, openSession],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("cashRegister.openSession")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="opening-balance">
              {t("cashRegister.openingBalance")}
            </Label>
            <Input
              id="opening-balance"
              type="number"
              min="0"
              step="100"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              placeholder="0"
              autoFocus
            />
            <Typography.Muted className="text-xs">
              Count the cash in the drawer and enter the amount.
            </Typography.Muted>
          </div>
          <Button
            type="submit"
            disabled={openSession.isPending || balance === ""}
          >
            {openSession.isPending ? (
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-1.5 size-3.5" />
            )}
            {openSession.isPending
              ? t("common.saving")
              : t("cashRegister.openSession")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Close Session Dialog ───────────────────────────────────

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
  const t = useTranslations();
  const [balance, setBalance] = useState("");
  const [note, setNote] = useState("");
  const closeSession = useCloseSession(orgId);

  const closingAmount = Number(balance) || 0;
  const expectedBalance =
    session.expected_balance ??
    session.opening_balance + session.cash_in - session.cash_out;
  const discrepancy = closingAmount - expectedBalance;
  const _hasDiscrepancy = closingAmount > 0 && discrepancy !== 0;

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (closingAmount < 0) return;

      await closeSession.mutateAsync(
        {
          sessionId: session.id,
          closing_balance: closingAmount,
          note: note || null,
        },
        {
          onSuccess: () => {
            onOpenChange(false);
            setBalance("");
            setNote("");
          },
        },
      );
    },
    [closingAmount, note, session.id, onOpenChange, closeSession],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("cashRegister.closeSession")}</DialogTitle>
        </DialogHeader>

        {/* Summary before closing */}
        <div className="rounded-lg border bg-muted/50 p-3 text-sm">
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
            <span className="font-medium text-emerald-600 dark:text-emerald-400">
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

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="closing-balance">
              {t("cashRegister.closingBalance")}
            </Label>
            <Input
              id="closing-balance"
              type="number"
              min="0"
              step="100"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              placeholder="0"
              autoFocus
            />
            <Typography.Muted className="text-xs">
              Count the cash in the drawer and enter the actual amount.
            </Typography.Muted>
          </div>

          {/* Live discrepancy preview */}
          {closingAmount > 0 && (
            <div
              className={`rounded-lg border p-3 text-sm ${
                discrepancy === 0
                  ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30"
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
                      ? "text-emerald-600 dark:text-emerald-400"
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
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("cashRegister.discrepancyNotePlaceholder")}
              rows={2}
            />
          </div>
          <Button
            type="submit"
            disabled={closeSession.isPending || balance === ""}
          >
            {closeSession.isPending ? (
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-1.5 size-3.5" />
            )}
            {closeSession.isPending
              ? t("common.saving")
              : t("cashRegister.closeSession")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Cash Out Dialog ────────────────────────────────────────

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
  const t = useTranslations();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const cashOut = useCashOut(orgId);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const amt = Number(amount);
      if (Number.isNaN(amt) || amt <= 0 || !description.trim()) return;

      await cashOut.mutateAsync(
        { sessionId, amount: amt, description: description.trim() },
        {
          onSuccess: () => {
            onOpenChange(false);
            setAmount("");
            setDescription("");
          },
        },
      );
    },
    [amount, description, sessionId, onOpenChange, cashOut],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("cashRegister.addCashOut")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="cashout-amount">
              {t("cashRegister.cashOutAmount")}
            </Label>
            <Input
              id="cashout-amount"
              type="number"
              min="1"
              step="100"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="cashout-description">
              {t("cashRegister.cashOutDescription")}
            </Label>
            <Input
              id="cashout-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("cashRegister.cashOutDescriptionPlaceholder")}
            />
          </div>
          <Button
            type="submit"
            disabled={cashOut.isPending || amount === "" || !description.trim()}
          >
            {cashOut.isPending ? (
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
            ) : (
              <MinusCircle className="mr-1.5 size-3.5" />
            )}
            {cashOut.isPending
              ? t("common.saving")
              : t("cashRegister.addCashOut")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Skeleton ───────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="flex flex-col gap-6 pb-8">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-9 w-32" />
      </div>
      <Skeleton className="h-16 rounded-xl" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[1, 2, 3, 4].map((n) => (
          <Skeleton key={n} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-48 rounded-xl" />
    </div>
  );
}
