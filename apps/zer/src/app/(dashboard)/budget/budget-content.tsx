"use client";

import { DownloadSimple, PencilSimple, Plus, Trash, Wallet, Warning } from "@phosphor-icons/react/dist/ssr";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { capture } from "@zuiio/capture";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { SlideInDrawer } from "@/components/ui/slide-in-drawer";
import { DrawerCancel, DrawerFooter, DrawerSubmit } from "@/components/ui/drawer-footer";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { NativeSelect } from "@/components/ui/native-select";
import { formatCurrency } from "@/lib/format";
import type { Budget } from "@/lib/budget";
import { calculateBudgetSummary, formatBudgetPeriod } from "@/lib/budget";
import { createClient } from "@/lib/supabase/client";
import { logAuditEvent } from "@/lib/audit";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ErrorBanner } from "@/components/ui/error-banner";
import { PageShell } from "@/components/erp/page-shell";
import { toCsv } from "@/lib/export";

const CATEGORIES = ["Маркетинг", "Үйл ажиллагаа", "Цалин", "Түрээс", "Бусад"];
const PERIODS = [{ value: "monthly", label: "Сар бүр" }, { value: "quarterly", label: "Улирал бүр" }, { value: "yearly", label: "Жил бүр" }];

function progressColor(pct: number, threshold: number) { return pct >= 100 ? "bg-destructive" : pct >= threshold ? "bg-yellow-500" : "bg-primary"; }

export function BudgetContent({ orgId }: { orgId: string }) {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: "", category: "Бусад", amount: "", period: "monthly", start_date: "", end_date: "", alert_threshold: "80" });
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const budgetsQuery = useQuery({
    queryKey: ["budgets", orgId],
    queryFn: async () => {
      const supabase = createClient() as unknown as SupabaseClient;
      const { data, error } = await supabase.from("budgets").select("*").eq("organization_id", orgId).order("created_at", { ascending: false });
      if (error) { capture(error); throw error; }
      return (data ?? []) as Budget[];
    },
    enabled: !!orgId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const supabase = createClient() as unknown as SupabaseClient;
      const { data, error } = await supabase.from("budgets").insert({ organization_id: orgId, name: form.name, category: form.category, amount: Number(form.amount), period: form.period, start_date: form.start_date, end_date: form.end_date, alert_threshold: Number(form.alert_threshold) }).select('id').single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => { logAuditEvent("created", "budget", data.id, undefined, "Төсөв үүсгэсэн: " + form.name); queryClient.invalidateQueries({ queryKey: ["budgets", orgId] }); toast.success("Төсөв нэмэгдлээ."); setCreateOpen(false); },
    onError: (e) => { capture(e); toast.error("Алдаа гарлаа."); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient() as unknown as SupabaseClient;
      const { error } = await supabase.from("budgets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, id) => { logAuditEvent("deleted", "budget", id, undefined, "Төсөв устгасан"); queryClient.invalidateQueries({ queryKey: ["budgets", orgId] }); toast.success("Төсөв устгагдлаа."); },
    onError: (e) => { capture(e); toast.error("Алдаа гарлаа."); },
  });

  const budgets = budgetsQuery.data ?? [];
  const summaries = budgets.map(calculateBudgetSummary);
  const totalBudget = summaries.reduce((s, b) => s + b.budget.amount, 0);
  const totalSpent = summaries.reduce((s, b) => s + b.spent, 0);
  const overBudget = summaries.filter((b) => b.isOverBudget).length;
  const handleExportBudgets = useCallback(() => {
    if (!summaries.length) return;
    const csv = toCsv(
      summaries.map((s) => ({
        name: s.budget.name,
        category: s.budget.category ?? "",
        amount: s.budget.amount,
        period: formatBudgetPeriod(s.budget.start_date, s.budget.end_date),
        spent: s.spent,
        percentage: `${Math.round(s.percentage)}%`,
      })),
      [
        { header: "Нэр", key: "name" },
        { header: "Ангилал", key: "category" },
        { header: "Дүн", key: "amount" },
        { header: "Хугацаа", key: "period" },
        { header: "Зарцуулсан", key: "spent" },
        { header: "Хувь", key: "percentage" },
      ],
    );
    const today = new Date().toISOString().slice(0, 10);
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `budgets-${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [summaries]);


  if (budgetsQuery.isLoading) return (
    <div className="space-y-6">
      <div className="flex justify-end"><Skeleton className="h-10 w-36" /></div>
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}><CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader><CardContent><Skeleton className="h-8 w-32" /></CardContent></Card>
        ))}
      </div>
      <Card><CardHeader><Skeleton className="h-5 w-32" /></CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between"><Skeleton className="h-4 w-40" /><Skeleton className="h-4 w-24" /></div>
              <Skeleton className="h-2 w-full" />
              <div className="flex justify-between"><Skeleton className="h-3 w-20" /><Skeleton className="h-3 w-28" /></div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );

  if (budgetsQuery.isError) {
    return (
      <PageShell title="Төсөв" description="Байгууллагын төсөв зардалын удирдлага">
        <ErrorBanner error={budgetsQuery.error} />
        <div className="mt-4 text-center">
          <Button variant="outline" onClick={() => budgetsQuery.refetch()}>Дахин оролдох</Button>
        </div>
      </PageShell>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={handleExportBudgets} title="CSV татаж авах"><DownloadSimple className="mr-1 size-4" />Татаж авах</Button>
        <Button onClick={() => setCreateOpen(true)} title="Нэмэх"><Plus className="mr-1 size-4" />Төсөв нэмэх</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Нийт төсөв</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{formatCurrency(totalBudget)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Зарцуулалт</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{formatCurrency(totalSpent)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Үлдэгдэл</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{formatCurrency(totalBudget - totalSpent)}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Хэтрүүлсэн</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-destructive">{overBudget}</p></CardContent></Card>
      </div>

      <Card><CardHeader><CardTitle>Төсөв бүрээр</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {summaries.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground mb-3">Төсөв байхгүй байна. Эхний төсвөө үүсгэнэ үү.</p>
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="mr-1 size-4" />
                Төсөв үүсгэх
              </Button>
            </div>
          ) : summaries.map((s) => (
            <div key={s.budget.id} className="space-y-2" role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); } }}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">{s.budget.name}</span>{s.budget.category && <span className="ml-2 text-sm text-muted-foreground">({s.budget.category})</span>}
                  <p className="text-xs text-muted-foreground">{formatBudgetPeriod(s.budget.start_date, s.budget.end_date)}</p>
                </div>
                <div className="flex items-center gap-2"><span className="text-sm">{formatCurrency(s.spent)} / {formatCurrency(s.budget.amount)}</span>
                  {deleteConfirmId === s.budget.id ? (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">Устгах уу?</span>
                      <Button size="icon" variant="ghost" onClick={() => { deleteMutation.mutate(s.budget.id); setDeleteConfirmId(null); }} title="Устгах"><Trash className="size-4 text-destructive" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => setDeleteConfirmId(null)} className="text-xs">Цуцлах</Button>
                    </div>
                  ) : (
                    <Button size="icon" variant="ghost" aria-label="Төсөв устгах" title="Устгах" onClick={() => setDeleteConfirmId(s.budget.id)}><Trash className="size-4 text-destructive" /></Button>
                  )}
                </div>
              </div>
              <Progress value={Math.min(s.percentage, 100)} className={`h-2 ${progressColor(s.percentage, s.budget.alert_threshold)}`} />
              <div className="flex justify-between text-xs text-muted-foreground"><span>{Math.round(s.percentage)}% ашигласан</span><span>{s.daysLeft > 0 ? `${s.daysLeft} өдөр үлдсэн` : "Дууссан"}</span></div>
            </div>
          ))}
        </CardContent>
      </Card>

      <SlideInDrawer open={createOpen} onOpenChange={setCreateOpen} title="Шинэ төсөв"
        footer={<DrawerFooter><DrawerCancel onClick={() => setCreateOpen(false)} /><DrawerSubmit form="budget-form" label="Хадгалах" /></DrawerFooter>}>
        <form id="budget-form" onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }}>
          <FieldGroup>
            <Field><FieldLabel>Нэр</FieldLabel><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field><FieldLabel>Ангилал</FieldLabel><NativeSelect value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</NativeSelect></Field>
            <Field><FieldLabel>Дүн (₮)</FieldLabel><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></Field>
            <Field><FieldLabel>Хугацаа</FieldLabel><NativeSelect value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })}>{PERIODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}</NativeSelect></Field>
            <div className="grid grid-cols-2 gap-3"><Field><FieldLabel>Эхлэх</FieldLabel><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></Field>
              <Field><FieldLabel>Дуусах</FieldLabel><Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></Field></div>
            <Field><FieldLabel>Анхааруулга хувь (%)</FieldLabel><Input type="number" value={form.alert_threshold} onChange={(e) => setForm({ ...form, alert_threshold: e.target.value })} /></Field>
          </FieldGroup>
        </form>
      </SlideInDrawer>
    </div>
  );
}
