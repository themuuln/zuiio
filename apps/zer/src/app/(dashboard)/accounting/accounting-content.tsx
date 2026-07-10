"use client";

import { Calculator, NotePencil, StackSimple } from "@phosphor-icons/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AccountCreateDrawer } from "@/components/accounting/account-create-drawer";
import { JournalEntryCreateDrawer } from "@/components/accounting/journal-entry-create-drawer";
import type { JournalEntryDetailData } from "@/components/accounting/journal-entry-detail-drawer";
import { JournalEntryDetailDrawer } from "@/components/accounting/journal-entry-detail-drawer";
import { JournalEntryEditDrawer } from "@/components/accounting/journal-entry-edit-drawer";
import { ErpEmptyState } from "@/components/erp/empty-state";
import { PageShell } from "@/components/erp/page-shell";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, formatDate } from "@/lib/format";
import { toggleAccountActive } from "./actions";
import { useQuery } from "@tanstack/react-query";
import { accountKeys, journalEntryKeys } from "@/lib/query/keys";
import { createClient } from "@/lib/supabase/client";
import { withDbCapture } from "@zuiio/capture";
import { useOrgSettings } from "@/lib/org-settings-context";
import { useBranchContext } from "@/lib/branch-context";
import { Skeleton } from "@/components/ui/skeleton";

type TrialBalanceRow = {
  account_id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  debit_balance: number;
  credit_balance: number;
};

type AccountRow = {
  id: string;
  code: string;
  name: string;
  type: string;
  parent_id: string | null;
  is_active: boolean;
};

type JournalEntryRow = {
  id: string;
  entry_date: string;
  entry_number: string;
  description: string | null;
  created_at: string | null;
  journal_entry_lines: Array<{
    id: string;
    debit_amount: number;
    credit_amount: number;
    account: { id: string; code: string; name: string } | null;
  }>;
};

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  asset: "Хөрөнгө",
  liability: "Өр төлбөр",
  equity: "Өмч",
  income: "Орлого",
  expense: "Зарлага",
};

const ACCOUNT_TYPE_VARIANTS = {
  asset: "default",
  liability: "secondary",
  equity: "outline",
  income: "default",
  expense: "destructive",
} as const;
// Typed record for Badge.variant access without any cast
const ACCOUNT_TYPE_VARIANTS_RECORD: Record<
  string,
  (typeof ACCOUNT_TYPE_VARIANTS)[keyof typeof ACCOUNT_TYPE_VARIANTS]
> = ACCOUNT_TYPE_VARIANTS;

export function AccountingContent({
  urlBranch,
  initialConsolidated,
}: {
  urlBranch?: string;
  initialConsolidated?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { organizationId } = useOrgSettings();
  const { isBranchScoped, userBranchId } = useBranchContext();

  const [createOpen, setCreateOpen] = useState(
    () => searchParams.get("create") === "true",
  );
  const [createAccountOpen, setCreateAccountOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("trial-balance");
  const initialRef = useRef(createOpen);
  const [selectedEntry, setSelectedEntry] =
    useState<JournalEntryDetailData | null>(null);
  const [editEntryId, setEditEntryId] = useState<string | null>(null);
  const [consolidated, setConsolidated] = useState(initialConsolidated ?? false);

  // Determine effective branch filter
  const showConsolidated = !isBranchScoped && consolidated;
  const effectiveBranchId = showConsolidated
    ? null
    : isBranchScoped
      ? userBranchId
      : (urlBranch ?? null);

  // ── Fetch trial balance ──
  const trialBalanceQuery = useQuery({
    queryKey: [
      "accounting",
      "trial-balance",
      organizationId,
      effectiveBranchId,
    ],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await withDbCapture(
        "page:accounting:trial_balance",
        supabase.rpc("get_trial_balance", {
          p_organization_id: organizationId,
          p_branch_id: effectiveBranchId ?? undefined,
        }),
      );
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!organizationId,
  });
  const accountsQuery = useQuery({
    queryKey: [
      "accounting",
      "chart-of-accounts",
      organizationId,
      effectiveBranchId,
    ],
    queryFn: async () => {
      const supabase = createClient();
      let query = supabase
        .from("chart_of_accounts")
        .select("id, code, name, type, parent_id, is_active")
        .eq("organization_id", organizationId)
        .order("code");
      if (effectiveBranchId) {
        query = query.eq("branch_id", effectiveBranchId);
      }
      const { data, error } = await withDbCapture(
        "page:accounting chart_of_accounts",
        query,
      );
      if (error) throw error;
      return (data ?? []) as unknown as AccountRow[];
    },
    enabled: !!organizationId,
  });

  // ── Fetch journal entries ──
  const journalEntriesQuery = useQuery({
    queryKey: [
      "accounting",
      "journal-entries",
      organizationId,
      effectiveBranchId,
    ],
    queryFn: async () => {
      const supabase = createClient();
      let query = supabase
        .from("journal_entries")
        .select(
          `id,
          entry_date,
          entry_number,
          description,
          created_at,
          journal_entry_lines (
            id,
            debit_amount,
            credit_amount,
            account:chart_of_accounts (id, code, name)
          )`,
        )
        .eq("organization_id", organizationId)
        .order("entry_date", { ascending: false })
        .limit(50);
      if (effectiveBranchId) {
        query = query.eq("branch_id", effectiveBranchId);
      }
      const { data, error } = await withDbCapture(
        "page:accounting journal_entries",
        query,
      );
      if (error) throw error;
      return (data ?? []) as unknown as JournalEntryRow[];
    },
    enabled: !!organizationId,
  });

  const trialBalance = trialBalanceQuery.data ?? [];
  const accounts = accountsQuery.data ?? [];
  const journalEntries = journalEntriesQuery.data ?? [];
  const isLoading = trialBalanceQuery.isLoading || trialBalanceQuery.isFetching;

  const accountsById = useMemo(
    () => new Map(accounts.map((a) => [a.id, a])),
    [accounts],
  );

  // Sync consolidated state with URL on toggle
  const toggleConsolidated = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (consolidated) {
      params.delete("consolidated");
    } else {
      params.set("consolidated", "true");
    }
    const qs = params.toString();
    router.replace(`/accounting${qs ? `?${qs}` : ""}`);
    setConsolidated(!consolidated);
  }, [consolidated, router, searchParams]);

  useEffect(() => {
    if (initialRef.current) {
      window.history.replaceState({}, "", "/accounting");
    }
  }, []);

  const processedEntries = useMemo(() => {
    return journalEntries.map((entry) => {
      let debitTotal = 0;
      let creditTotal = 0;
      for (const line of entry.journal_entry_lines ?? []) {
        debitTotal += Number(line.debit_amount ?? 0);
        creditTotal += Number(line.credit_amount ?? 0);
      }
      return { ...entry, debitTotal, creditTotal };
    });
  }, [journalEntries]);

  return (
    <PageShell
      title="Нягтлан бодох бүртгэл"
      description="Давхар бичилтийн нягтлан бодох бүртгэлийн систем"
    >
      {/* Consolidated view toggle - only for admin users */}
      {!isBranchScoped && (
        <div className="mb-4 flex items-center justify-end gap-2">
          <span className="text-sm text-muted-foreground">
            <StackSimple className="mr-1 inline size-4" />
            Бүх салбарын мэдээлэл
          </span>
          <Switch checked={consolidated} onCheckedChange={toggleConsolidated} />
        </div>
      )}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="trial-balance">Туршилтын баланс</TabsTrigger>
          <TabsTrigger value="journal-entries">Журналын бичилт</TabsTrigger>
          <TabsTrigger value="chart-of-accounts">Дансны бүртгэл</TabsTrigger>
        </TabsList>

        {/* Trial Balance Tab */}
        <TabsContent value="trial-balance">
          {isLoading ? (
            <Card>
              <CardHeader>
                <CardTitle>Туршилтын баланс</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-2 p-4">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : trialBalance.length === 0 ? (
            <ErpEmptyState
              icon={<Calculator className="size-4" />}
              title="Туршилтын баланс хоосон"
              description="Журналын бичилт хийсний дараа туршилтын баланс гарч ирнэ."
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Туршилтын баланс</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Код</TableHead>
                      <TableHead>Дансны нэр</TableHead>
                      <TableHead>Төрөл</TableHead>
                      <TableHead className="text-right">Дебет</TableHead>
                      <TableHead className="text-right">Кредит</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trialBalance.map((row) => (
                      <TableRow key={row.account_id}>
                        <TableCell className="font-mono text-xs">
                          {row.account_code}
                        </TableCell>
                        <TableCell>{row.account_name}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              ACCOUNT_TYPE_VARIANTS_RECORD[row.account_type] ??
                              "outline"
                            }
                          >
                            {ACCOUNT_TYPE_LABELS[row.account_type] ??
                              row.account_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {row.debit_balance > 0
                            ? formatCurrency(row.debit_balance)
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {row.credit_balance > 0
                            ? formatCurrency(row.credit_balance)
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Journal Entries Tab */}
        <TabsContent value="journal-entries">
          <div className="mb-4 flex justify-end">
            <JournalEntryCreateDrawer
              accounts={accounts}
              open={createOpen}
              onOpenChange={setCreateOpen}
            />
          </div>
          {isLoading ? (
            <Card>
              <CardHeader>
                <CardTitle>Журналын бичилтүүд</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-2 p-4">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : journalEntries.length === 0 ? (
            <ErpEmptyState
              icon={<Calculator className="size-4" />}
              title="Журналын бичилт байхгүй"
              description="Шинэ журналын бичилт үүсгэнэ үү."
              action={
                <button
                  type="button"
                  className={buttonVariants({ variant: "default" })}
                  onClick={() => setCreateOpen(true)}
                >
                  <Calculator className="size-4" />
                  Шинэ бичилт
                </button>
              }
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Журналын бичилтүүд</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Огноо</TableHead>
                      <TableHead>Дугаар</TableHead>
                      <TableHead>Тайлбар</TableHead>
                      <TableHead className="text-right">Нийт дебет</TableHead>
                      <TableHead className="text-right">Нийт кредит</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processedEntries.map((entry) => {
                      const { debitTotal, creditTotal } = entry;
                      return (
                        <TableRow
                          key={entry.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setSelectedEntry(entry)}
                        >
                          <TableCell>{formatDate(entry.entry_date)}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {entry.entry_number}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {entry.description ?? "-"}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(debitTotal)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(creditTotal)}
                          </TableCell>
                          <TableCell>
                            <span className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditEntryId(entry.id);
                                }}
                                className="flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                title="Засах"
                              >
                                <NotePencil className="size-3.5" />
                              </button>
                              <span className="text-xs text-muted-foreground">
                                Дэлгэрэнгүй
                              </span>
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Chart of Accounts Tab */}
        <TabsContent value="chart-of-accounts">
          <div className="mb-4 flex justify-end">
            <AccountCreateDrawer
              accounts={accounts}
              open={createAccountOpen}
              onOpenChange={setCreateAccountOpen}
            />
          </div>
          {isLoading ? (
            <Card>
              <CardHeader>
                <CardTitle>Дансны бүртгэл</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-2 p-4">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : accounts.length === 0 ? (
            <ErpEmptyState
              icon={<Calculator className="size-4" />}
              title="Данс бүртгэгдээгүй"
              description="Шинэ данс нэмж, дансны бүртгэлээ тохируулна уу."
              action={
                <button
                  type="button"
                  className={buttonVariants({ variant: "default" })}
                  onClick={() => setCreateAccountOpen(true)}
                >
                  <Calculator className="size-4" />
                  Шинэ данс
                </button>
              }
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Дансны бүртгэл</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Код</TableHead>
                      <TableHead>Нэр</TableHead>
                      <TableHead>Төрөл</TableHead>
                      <TableHead>Эх данс</TableHead>
                      <TableHead>Төлөв</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accounts.map((account) => {
                      const parentName = account.parent_id
                        ? (accounts.find((a) => a.id === account.parent_id)
                            ?.name ?? "-")
                        : "-";

                      return (
                        <TableRow key={account.id}>
                          <TableCell className="font-mono text-xs">
                            {account.code}
                          </TableCell>
                          <TableCell>{account.name}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                ACCOUNT_TYPE_VARIANTS_RECORD[account.type] ??
                                "outline"
                              }
                            >
                              {ACCOUNT_TYPE_LABELS[account.type] ??
                                account.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {parentName}
                          </TableCell>
                          <TableCell>
                            <button
                              type="button"
                              onClick={async () => {
                                const result = await toggleAccountActive(
                                  account.id,
                                  !account.is_active,
                                );
                                if (result && "error" in result) {
                                  toast.error(result.error);
                                }
                              }}
                              className="cursor-pointer"
                            >
                              <Badge
                                variant={
                                  account.is_active ? "default" : "outline"
                                }
                                className="cursor-pointer hover:opacity-80"
                              >
                                {account.is_active ? "Идэвхтэй" : "Идэвхгүй"}
                              </Badge>
                            </button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <JournalEntryDetailDrawer
        entry={selectedEntry ?? ({} as JournalEntryDetailData)}
        accounts={accounts}
        open={!!selectedEntry}
        onOpenChange={(open) => {
          if (!open) setSelectedEntry(null);
        }}
      />
      {editEntryId &&
        (() => {
          const entry = editEntryId ? journalEntries.find((e) => e.id === editEntryId) : null;
          if (!entry) return null;
          return (
            <JournalEntryEditDrawer
              entry={entry}
              accounts={accounts}
              open={!!editEntryId}
              onOpenChange={(open) => {
                if (!open) setEditEntryId(null);
              }}
            />
          );
        })()}
    </PageShell>
  );
}
