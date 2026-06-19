"use client";

import { Calculator, StackSimple } from "@phosphor-icons/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AccountCreateDrawer } from "@/components/accounting/account-create-drawer";
import type { JournalEntryDetailData } from "@/components/accounting/journal-entry-detail-drawer";
import { JournalEntryDetailDrawer } from "@/components/accounting/journal-entry-detail-drawer";
import { JournalEntryCreateDrawer } from "@/components/accounting/journal-entry-create-drawer";
import { ErpEmptyState } from "@/components/erp/empty-state";
import { PageShell } from "@/components/erp/page-shell";
import { Badge } from "@/components/ui/badge";
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

const ACCOUNT_TYPE_VARIANTS: Record<string, string> = {
  asset: "default",
  liability: "secondary",
  equity: "outline",
  income: "default",
  expense: "destructive",
};

export function AccountingContent({
  trialBalance,
  accounts,
  journalEntries,
  isBranchScoped,
  showConsolidated: initialConsolidated,
}: {
  trialBalance: TrialBalanceRow[];
  accounts: AccountRow[];
  journalEntries: JournalEntryRow[];
  isBranchScoped: boolean;
  showConsolidated: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [createOpen, setCreateOpen] = useState(
    searchParams.get("create") === "true",
  );
  const [createAccountOpen, setCreateAccountOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("trial-balance");
  const initialRef = useRef(createOpen);
  const [selectedEntry, setSelectedEntry] =
    useState<JournalEntryDetailData | null>(null);
  const [consolidated, setConsolidated] = useState(initialConsolidated);

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

  const hasContent =
    trialBalance.length > 0 || journalEntries.length > 0 || accounts.length > 0;

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
          {trialBalance.length === 0 ? (
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
                              (ACCOUNT_TYPE_VARIANTS[
                                row.account_type
                              ] as any) ?? "outline"
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
          {journalEntries.length === 0 ? (
            <ErpEmptyState
              icon={<Calculator className="size-4" />}
              title="Журналын бичилт байхгүй"
              description="Шинэ журналын бичилт үүсгэнэ үү."
              action={
                <JournalEntryCreateDrawer
                  accounts={accounts}
                  open={createOpen}
                  onOpenChange={setCreateOpen}
                />
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
                    {journalEntries.map((entry) => {
                      const totalDebit = entry.journal_entry_lines.reduce(
                        (s, l) => s + l.debit_amount,
                        0,
                      );
                      const totalCredit = entry.journal_entry_lines.reduce(
                        (s, l) => s + l.credit_amount,
                        0,
                      );

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
                            {formatCurrency(totalDebit)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(totalCredit)}
                          </TableCell>
                          <TableCell>
                            <span className="text-xs text-muted-foreground">
                              Дэлгэрэнгүй
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
          {accounts.length === 0 ? (
            <ErpEmptyState
              icon={<Calculator className="size-4" />}
              title="Данс бүртгэгдээгүй"
              description="Шинэ данс нэмж, дансны бүртгэлээ тохируулна уу."
              action={
                <AccountCreateDrawer
                  accounts={accounts}
                  open={createAccountOpen}
                  onOpenChange={setCreateAccountOpen}
                />
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
                                (ACCOUNT_TYPE_VARIANTS[account.type] as any) ??
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
                                if (result?.error) {
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

      {selectedEntry && (
        <JournalEntryDetailDrawer
          entry={selectedEntry}
          accounts={accounts}
          open={!!selectedEntry}
          onOpenChange={(open) => {
            if (!open) setSelectedEntry(null);
          }}
        />
      )}
    </PageShell>
  );
}
