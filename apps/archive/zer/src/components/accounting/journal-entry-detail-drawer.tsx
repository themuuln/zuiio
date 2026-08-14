"use client";

import { PencilSimple, Trash } from "@phosphor-icons/react";
import { useState } from "react";
import { deleteJournalEntry } from "@/app/(dashboard)/accounting/actions";
import { buttonVariants } from "@/components/ui/button";
import { SlideInDrawer } from "@/components/ui/slide-in-drawer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/format";
import { JournalEntryEditDrawer } from "./journal-entry-edit-drawer";

type JournalEntryLine = {
  id: string;
  debit_amount: number;
  credit_amount: number;
  account: { id: string; code: string; name: string } | null;
};

type AccountRow = {
  id: string;
  code: string;
  name: string;
  type: string;
  parent_id: string | null;
  is_active: boolean;
};

export type JournalEntryDetailData = {
  id: string;
  entry_date: string;
  entry_number: string;
  description: string | null;
  created_at: string | null;
  journal_entry_lines: JournalEntryLine[];
};

export function JournalEntryDetailDrawer({
  entry,
  accounts,
  open,
  onOpenChange,
}: {
  entry: JournalEntryDetailData;
  accounts: AccountRow[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const totalDebit = (entry.journal_entry_lines ?? []).reduce(
    (s, l) => s + l.debit_amount,
    0,
  );
  const totalCredit = (entry.journal_entry_lines ?? []).reduce(
    (s, l) => s + l.credit_amount,
    0,
  );

  const handleDelete = async () => {
    if (!window.confirm("Журналын бичилтийг устгахдаа итгэлтэй байна уу?")) {
      return;
    }
    setDeleting(true);
    const result = await deleteJournalEntry(entry.id);
    if (result?.error) {
      alert(result.error);
    } else {
      onOpenChange(false);
    }
    setDeleting(false);
  };

  return (
    <>
      <SlideInDrawer
        open={open}
        onOpenChange={onOpenChange}
        title="Журналын бичилтийн дэлгэрэнгүй"
        description={`${entry.entry_number} • ${formatDate(entry.entry_date)}`}
        panelWidth="36rem"
      >
        <div className="space-y-5">
          {/* Description */}
          <div>
            <span className="text-sm font-medium text-muted-foreground">
              Тайлбар
            </span>
            <p className="mt-1">{entry.description ?? "-"}</p>
          </div>

          {/* Lines table */}
          <div>
            <span className="text-sm font-medium text-muted-foreground">
              Мөрүүд
            </span>
            <div className="mt-2 rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Дансны код</TableHead>
                    <TableHead>Дансны нэр</TableHead>
                    <TableHead className="text-right">Дебет</TableHead>
                    <TableHead className="text-right">Кредит</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entry.journal_entry_lines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell className="font-mono text-xs">
                        {line.account?.code ?? "-"}
                      </TableCell>
                      <TableCell>{line.account?.name ?? "-"}</TableCell>
                      <TableCell className="text-right font-mono">
                        {line.debit_amount > 0
                          ? formatCurrency(line.debit_amount)
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {line.credit_amount > 0
                          ? formatCurrency(line.credit_amount)
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Totals */}
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-muted-foreground">
                  Нийт дебет:
                </span>
                <span className="ml-2 text-base font-semibold">
                  {formatCurrency(totalDebit)}
                </span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">
                  Нийт кредит:
                </span>
                <span className="ml-2 text-base font-semibold">
                  {formatCurrency(totalCredit)}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 border-t pt-4">
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className={buttonVariants({ variant: "outline" })}
            >
              <PencilSimple className="mr-1 size-4" />
              Засах
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className={buttonVariants({ variant: "destructive" })}
            >
              <Trash className="mr-1 size-4" />
              {deleting ? "Устгаж байна..." : "Устгах"}
            </button>
          </div>
        </div>
      </SlideInDrawer>

      <JournalEntryEditDrawer
        entry={entry}
        accounts={accounts}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  );
}
