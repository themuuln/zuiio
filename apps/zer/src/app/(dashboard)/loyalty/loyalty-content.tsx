"use client";

import { DownloadSimple, Gift, Trophy } from "@phosphor-icons/react/dist/ssr";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { capture } from "@zuiio/capture";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SlideInDrawer } from "@/components/ui/slide-in-drawer";
import { DrawerCancel, DrawerFooter, DrawerSubmit } from "@/components/ui/drawer-footer";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { formatPoints } from "@/lib/loyalty";
import { createClient } from "@/lib/supabase/client";
import { logAuditEvent } from "@/lib/audit";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ErrorBanner } from "@/components/ui/error-banner";
import { PageShell } from "@/components/erp/page-shell";
import { toCsv } from "@/lib/export";

type Settings = { id: string; points_per_mnt: number; min_purchase: number; is_enabled: boolean } | null;
type Reward = { id: string; name: string; description: string | null; points_cost: number; discount_type: string | null; discount_value: number | null; is_active: boolean };
type Customer = { id: string; full_name: string; points_balance: number };

export function LoyaltyContent({ orgId }: { orgId: string }) {
  const queryClient = useQueryClient();
  const [rewardOpen, setRewardOpen] = useState(false);
  const [rewardForm, setRewardForm] = useState({ name: "", description: "", points_cost: "", discount_type: "percentage", discount_value: "" });
  const [rewardErrors, setRewardErrors] = useState<{ name?: string; points_cost?: string }>({});
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ points_per_mnt: 1, min_purchase: 0 });
  const [confirmToggleOff, setConfirmToggleOff] = useState(false);

  const dataQuery = useQuery({
    queryKey: ["loyalty", orgId],
    queryFn: async () => {
      const supabase = createClient() as unknown as SupabaseClient;
      const { data: settings } = await supabase.from("loyalty_settings").select("*").eq("organization_id", orgId).single();
      const { data: rewards } = await supabase.from("loyalty_rewards").select("*").eq("organization_id", orgId).order("points_cost");
      const { data: customers } = await supabase.from("contacts").select("id, full_name, points_balance").eq("organization_id", orgId).gt("points_balance", 0).order("points_balance", { ascending: false }).limit(10);
      return { settings: settings as Settings, rewards: (rewards ?? []) as Reward[], customers: (customers ?? []) as Customer[] };
    },
    enabled: !!orgId,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async ({ points_per_mnt, min_purchase }: { points_per_mnt: number; min_purchase: number }) => {
      const supabase = createClient() as unknown as SupabaseClient;
      const { data: existing } = await supabase.from("loyalty_settings").select("id").eq("organization_id", orgId).single();
      if (existing) {
        const { error } = await supabase.from("loyalty_settings").update({ points_per_mnt, min_purchase }).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("loyalty_settings").insert({ organization_id: orgId, points_per_mnt, min_purchase, is_enabled: true });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      logAuditEvent("updated", "loyalty_setting", settings?.id ?? "", undefined, "Лояалти тохиргоо шинэчилсэн");
      queryClient.invalidateQueries({ queryKey: ["loyalty", orgId] });
      toast.success("Тохиргоо хадгалагдлаа.");
      setEditMode(false);
    },
    onError: (e) => { capture(e); toast.error("Алдаа гарлаа."); },
  });

  const toggleMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const supabase = createClient() as unknown as SupabaseClient;
      const { data: existing } = await supabase.from("loyalty_settings").select("id").eq("organization_id", orgId).single();
      if (existing) { await supabase.from("loyalty_settings").update({ is_enabled: enabled }).eq("id", existing.id); }
      else { await supabase.from("loyalty_settings").insert({ organization_id: orgId, is_enabled: enabled, points_per_mnt: 1, min_purchase: 0 }); }
    },
    onSuccess: (_data, enabled) => {
      logAuditEvent("status_changed", "loyalty_setting", settings?.id ?? "", { is_enabled: { old: !enabled, new: enabled } }, enabled ? "Лояалти идэвхжүүлсэн" : "Лояалти идэвхгүй болгосон");
    },
    onMutate: async (enabled) => {
      await queryClient.cancelQueries({ queryKey: ["loyalty", orgId] });
      const prev = queryClient.getQueryData<{ settings: Settings; rewards: Reward[]; customers: Customer[] }>(["loyalty", orgId]);
      if (prev?.settings) {
        queryClient.setQueryData(["loyalty", orgId], { ...prev, settings: { ...prev.settings, is_enabled: enabled } });
      }
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) queryClient.setQueryData(["loyalty", orgId], context.prev);
      capture(_err);
      toast.error("Алдаа гарлаа.");
    },
    onSettled: () => { queryClient.invalidateQueries({ queryKey: ["loyalty", orgId] }); toast.success("Шинэчлэгдлээ."); },
  });

  const createRewardMutation = useMutation({
    mutationFn: async () => {
      const supabase = createClient() as unknown as SupabaseClient;
      const { data, error } = await supabase.from("loyalty_rewards").insert({ organization_id: orgId, name: rewardForm.name, description: rewardForm.description || null, points_cost: Number(rewardForm.points_cost), discount_type: rewardForm.discount_type, discount_value: Number(rewardForm.discount_value) || null, is_active: true }).select('id').single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => { logAuditEvent("created", "loyalty_reward", data.id, undefined, "Шагнал нэмсэн: " + rewardForm.name); queryClient.invalidateQueries({ queryKey: ["loyalty", orgId] }); toast.success("Шагнал нэмэгдлээ."); setRewardOpen(false); resetRewardForm(); },
    onError: (e) => { capture(e); toast.error("Алдаа гарлаа."); },
  });

  const resetRewardForm = useCallback(() => {
    setRewardForm({ name: "", description: "", points_cost: "", discount_type: "percentage", discount_value: "" });
    setRewardErrors({});
  }, []);

  const isRewardFormValid = useMemo(() => {
    const nameOk = rewardForm.name.trim().length > 0;
    const costNum = Number(rewardForm.points_cost);
    const costOk = !isNaN(costNum) && costNum > 0;
    return nameOk && costOk;
  }, [rewardForm.name, rewardForm.points_cost]);

  const validateAndSubmitReward = useCallback(() => {
    const errors: { name?: string; points_cost?: string } = {};
    if (!rewardForm.name.trim()) errors.name = "Нэр заавал байх ёстой.";
    const costNum = Number(rewardForm.points_cost);
    if (isNaN(costNum) || costNum <= 0) errors.points_cost = "Онооны зардал 0-ээс их байх ёстой.";
    setRewardErrors(errors);
    if (Object.keys(errors).length === 0) createRewardMutation.mutate();
  }, [rewardForm.name, rewardForm.points_cost, createRewardMutation]);

  const handleToggleChange = useCallback((checked: boolean) => {
    if (!checked) {
      setConfirmToggleOff(true);
    } else {
      toggleMutation.mutate(true);
    }
  }, [toggleMutation]);

  const handleConfirmToggleOff = useCallback(() => {
    setConfirmToggleOff(false);
    toggleMutation.mutate(false);
  }, [toggleMutation]);

  const handleEditSave = useCallback(() => {
    updateSettingsMutation.mutate(editForm);
  }, [updateSettingsMutation, editForm]);
  const handleExportRewards = useCallback(() => {
    const rewards = dataQuery.data?.rewards ?? [];
    if (!rewards.length) return;
    const csv = toCsv(
      rewards.map((r) => ({
        name: r.name,
        description: r.description ?? "",
        points_cost: r.points_cost,
        discount_type: r.discount_type === "percentage" ? "Хувь" : r.discount_type === "fixed" ? "Дүн" : (r.discount_type ?? ""),
        discount_value: r.discount_value ?? "",
        is_active: r.is_active ? "Тийм" : "Үгүй",
      })),
      [
        { header: "Нэр", key: "name" },
        { header: "Тодорхойлолт", key: "description" },
        { header: "Оноо", key: "points_cost" },
        { header: "Хөнгөлөлтийн төрөл", key: "discount_type" },
        { header: "Хөнгөлөлтийн хэмжээ", key: "discount_value" },
        { header: "Идэвхтэй", key: "is_active" },
      ],
    );
    const today = new Date().toISOString().slice(0, 10);
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `loyalty-rewards-${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [dataQuery.data]);



  if (dataQuery.isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }
  if (dataQuery.isError) {
    return (
      <PageShell title="Лояалти хөтөлбөр" description="Хэрэглэгчийн үнэнч шалтгааны хөтөлбөр">
        <ErrorBanner error={dataQuery.error} />
        <div className="mt-4 text-center">
          <Button variant="outline" onClick={() => dataQuery.refetch()}>Дахин оролдох</Button>
        </div>
      </PageShell>
    );
  }

  const { settings, rewards = [], customers = [] } = dataQuery.data ?? {};

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Лоялти идэвхжүүлэх</p>
              <p className="text-sm text-muted-foreground">Худалдан авалт бүрт оноо цуглуулах</p>
            </div>
            <Switch checked={settings?.is_enabled ?? false} onCheckedChange={handleToggleChange} />
          </div>
          {editMode ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel>Онооны харьцаа (Нэг/₮)</FieldLabel>
                  <Input type="number" value={editForm.points_per_mnt} onChange={(e) => setEditForm({ ...editForm, points_per_mnt: Number(e.target.value) })} />
                </Field>
                <Field>
                  <FieldLabel>Хамгийн бага худалдан авалт (₮)</FieldLabel>
                  <Input type="number" value={editForm.min_purchase} onChange={(e) => setEditForm({ ...editForm, min_purchase: Number(e.target.value) })} />
                </Field>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditMode(false)} disabled={updateSettingsMutation.isPending}>Цуцлах</Button>
                <Button size="sm" onClick={handleEditSave} disabled={updateSettingsMutation.isPending}>
                  {updateSettingsMutation.isPending ? "Хадгалж байна..." : "Хадгалах"}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-muted-foreground">Онооны харьцаа (Нэг/₮)</p><p className="font-medium">{settings?.points_per_mnt ?? 1}</p></div>
                <div><p className="text-sm text-muted-foreground">Хамгийн бага худалдан авалт (₮)</p><p className="font-medium">{settings?.min_purchase ?? 0}</p></div>
              </div>
              <div className="flex justify-end">
                <Button variant="outline" size="sm" title="Засах" onClick={() => {
                  setEditForm({ points_per_mnt: settings?.points_per_mnt ?? 1, min_purchase: settings?.min_purchase ?? 0 });
                  setEditMode(true);
                }}>
                  Засах
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Идэвхтэй гишүүд</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{customers.length}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Шагналууд</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{rewards.length}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Шагналууд</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleExportRewards} title="CSV татаж авах"><DownloadSimple className="mr-1 size-4" />Татаж авах</Button>
            <Button size="sm" onClick={() => { resetRewardForm(); setRewardOpen(true); }} title="Нэмэх"><Gift className="mr-1 size-4" />Шагнал нэмэх</Button>
          </div>
        </CardHeader>
        <CardContent>
          {rewards.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground mb-3">Шагнал байхгүй байна. Анхны шагналаа нэмнэ үү.</p>
              <Button size="sm" onClick={() => { resetRewardForm(); setRewardOpen(true); }}>
                <Gift className="mr-1 size-4" />
                Шагнал нэмэх
              </Button>
            </div>
          ) : (
            <div className="space-y-2">{rewards.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded border p-3" role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); } }}>
                <div><p className="font-medium">{r.name}</p><p className="text-sm text-muted-foreground">{formatPoints(r.points_cost)} оноо</p></div>
                <Badge variant={r.is_active ? "default" : "secondary"}>{r.is_active ? "Идэвхтэй" : "Идэвхгүй"}</Badge>
              </div>
            ))}</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Trophy className="size-5" />Шилдэг хэрэглэгчид</CardTitle>
        </CardHeader>
        <CardContent>
          {customers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Үнэнч хэрэглэгч байхгүй байна.</p>
          ) : (
            <div className="space-y-2">{customers.map((c, i) => (
              <div key={c.id} className="flex items-center justify-between rounded border p-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-8 items-center justify-center rounded-full bg-muted text-sm font-medium">{i + 1}</span>
                  <div><p className="font-medium">{c.full_name}</p><p className="text-sm text-muted-foreground">{formatPoints(c.points_balance)} оноо</p></div>
                </div>
              </div>
            ))}</div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={confirmToggleOff} onOpenChange={setConfirmToggleOff}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Лоялтийг идэвхгүй болгох уу?</AlertDialogTitle>
            <AlertDialogDescription>
              Идэвхгүй болгосноор хэрэглэгчид оноо цуглуулах боломжгүй болно. Та итгэлтэй байна уу?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Цуцлах</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmToggleOff}>Тийм, идэвхгүй болгох</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SlideInDrawer open={rewardOpen} onOpenChange={setRewardOpen} title="Шинэ шагнал"
        footer={<DrawerFooter><DrawerCancel onClick={() => setRewardOpen(false)} /><DrawerSubmit form="reward-form" label="Хадгалах" /></DrawerFooter>}>
        <form id="reward-form" onSubmit={(e) => { e.preventDefault(); validateAndSubmitReward(); }}>
          <FieldGroup>
            <Field>
              <FieldLabel>Нэр</FieldLabel>
              <Input value={rewardForm.name} onChange={(e) => { setRewardForm({ ...rewardForm, name: e.target.value }); if (rewardErrors.name) setRewardErrors((p) => ({ ...p, name: undefined })); }} />
              {rewardErrors.name && <p className="text-xs text-destructive mt-1">{rewardErrors.name}</p>}
            </Field>
            <Field><FieldLabel>Тайлбар</FieldLabel><Textarea value={rewardForm.description} onChange={(e) => setRewardForm({ ...rewardForm, description: e.target.value })} /></Field>
            <Field>
              <FieldLabel>Онооны зардал</FieldLabel>
              <Input type="number" value={rewardForm.points_cost} onChange={(e) => { setRewardForm({ ...rewardForm, points_cost: e.target.value }); if (rewardErrors.points_cost) setRewardErrors((p) => ({ ...p, points_cost: undefined })); }} />
              {rewardErrors.points_cost && <p className="text-xs text-destructive mt-1">{rewardErrors.points_cost}</p>}
            </Field>
            <Field>
              <FieldLabel>Хөнгөлөлтийн төрөл</FieldLabel>
              <NativeSelect value={rewardForm.discount_type} onChange={(e) => setRewardForm({ ...rewardForm, discount_type: e.target.value })}>
                <option value="percentage">Хувь</option>
                <option value="fixed">Дүн</option>
              </NativeSelect>
            </Field>
            <Field><FieldLabel>Хөнгөлөлтийн дүн</FieldLabel><Input type="number" value={rewardForm.discount_value} onChange={(e) => setRewardForm({ ...rewardForm, discount_value: e.target.value })} /></Field>
          </FieldGroup>
        </form>
      </SlideInDrawer>
    </div>
  );
}
