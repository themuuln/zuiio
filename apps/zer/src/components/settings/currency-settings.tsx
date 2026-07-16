"use client";

import { CurrencyCircleDollar, Pencil, Plus, Star, Trash } from "@phosphor-icons/react/dist/ssr";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { capture } from "@zuiio/capture";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrgSettings } from "@/lib/org-settings-context";
import { formatCurrency } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

type Currency = { id: string; organization_id: string; code: string; name: string; symbol: string; is_default: boolean; exchange_rate: number; last_updated: string; created_at: string; };

export function CurrencySettings() {
  const { organizationId } = useOrgSettings();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newSymbol, setNewSymbol] = useState("");
  const [newRate, setNewRate] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingRate, setEditingRate] = useState("");
  const queryKey = ["currencies", organizationId];

  const currenciesQuery = useQuery({
    queryKey,
    queryFn: async () => {
      const supabase = createClient() as unknown as SupabaseClient;
      const { data, error } = await supabase.from("currencies").select("*").eq("organization_id", organizationId).order("is_default", { ascending: false });
      if (error) { capture(error); throw error; }
      return (data ?? []) as Currency[];
    },
    enabled: !!organizationId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const supabase = createClient() as unknown as SupabaseClient;
      const { error } = await supabase.from("currencies").insert({ organization_id: organizationId, code: newCode.toUpperCase(), name: newName, symbol: newSymbol, exchange_rate: Number(newRate) || 1.0, is_default: false });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey }); toast.success("Валют нэмэгдлээ."); setCreateOpen(false); setNewCode(""); setNewName(""); setNewSymbol(""); setNewRate(""); },
    onError: (e) => { capture(e); toast.error("Валют нэмэхэд алдаа гарлаа."); },
  });

  const updateRateMutation = useMutation({
    mutationFn: async ({ id, rate }: { id: string; rate: number }) => {
      const supabase = createClient() as unknown as SupabaseClient;
      const { error } = await supabase.from("currencies").update({ exchange_rate: rate, last_updated: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey }); toast.success("Ханш шинэчлэгдлээ."); setEditingId(null); },
    onError: (e) => { capture(e); toast.error("Ханш шинэчлэхэд алдаа гарлаа."); },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient() as unknown as SupabaseClient;
      const { error } = await supabase.from("currencies").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey }); toast.success("Валют устгагдлаа."); },
    onError: (e) => { capture(e); toast.error("Валют устгахад алдаа гарлаа."); },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient() as unknown as SupabaseClient;
      await supabase.from("currencies").update({ is_default: false }).eq("organization_id", organizationId);
      const { error } = await supabase.from("currencies").update({ is_default: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey }); toast.success("Үндсэн валют сонгогдлоо."); },
    onError: (e) => { capture(e); toast.error("Үндсэн валют сонгоход алдаа гарлаа."); },
  });

  const currencies = currenciesQuery.data ?? [];

  if (currenciesQuery.isLoading) return <Skeleton className="h-48 w-full" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Валютын удирдлага</h3>
          <p className="text-sm text-muted-foreground">Валютууд болон ханшийг удирдах</p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(!createOpen)}><Plus className="mr-1 size-4" />Валют нэмэх</Button>
      </div>

      {createOpen && (
        <Card><CardContent className="pt-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Код (USD)" value={newCode} onChange={(e) => setNewCode(e.target.value)} />
            <Input placeholder="Нэр" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <Input placeholder="Тэмдэгт ($)" value={newSymbol} onChange={(e) => setNewSymbol(e.target.value)} />
            <Input placeholder="Ханш (MNT)" type="number" value={newRate} onChange={(e) => setNewRate(e.target.value)} />
          </div>
          <Button onClick={() => createMutation.mutate()} disabled={!newCode || !newName || createMutation.isPending}>Хадгалах</Button>
        </CardContent></Card>
      )}

      {currencies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <CurrencyCircleDollar className="mb-2 size-10" /><p>Валют бүртгэгдээгүй байна.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {currencies.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <span className="text-lg font-medium">{c.symbol}</span>
                <div><p className="font-medium">{c.code} — {c.name}</p>
                  {editingId === c.id ? (
                    <div className="flex items-center gap-2 mt-1">
                      <Input className="h-7 w-32" type="number" value={editingRate} onChange={(e) => setEditingRate(e.target.value)} onKeyDown={(e) => e.key === "Enter" && updateRateMutation.mutate({ id: c.id, rate: Number(editingRate) })} autoFocus />
                      <Button size="sm" variant="ghost" onClick={() => updateRateMutation.mutate({ id: c.id, rate: Number(editingRate) })}>Хадгалах</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Цуцлах</Button>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Ханш: {formatCurrency(c.exchange_rate)} / 1 {c.code}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {c.is_default ? <Badge>Үндсэн</Badge> : (
                  <Button size="icon" variant="ghost" onClick={() => setDefaultMutation.mutate(c.id)}><Star className="size-4" /></Button>
                )}
                {!c.is_default && (
                  <Button size="icon" variant="ghost" onClick={() => { if (confirm("Валютыг устгах уу?")) deleteMutation.mutate(c.id); }}><Trash className="size-4 text-destructive" /></Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
