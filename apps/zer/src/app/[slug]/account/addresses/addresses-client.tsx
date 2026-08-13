"use client";

import { MapPin, PencilSimple, Plus, Trash } from "@phosphor-icons/react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { capture } from "@zuiio/capture";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useStorefrontBase } from "@/components/storefront/storefront-base-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { useStoreSession } from "../use-store-session";

/**
 * Row shape of `store_account_addresses` (backend migration; typed through
 * the untyped client until types regenerate). RLS restricts every row to
 * `store_account_id = auth.uid()`, so the client only needs the explicit
 * owner filter for the list.
 */
export type SavedAddress = {
  id: string;
  store_account_id: string;
  label: string | null;
  address: string | null;
  address_note: string | null;
  phone: string | null;
  is_default: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

type AddressForm = {
  label: string;
  address: string;
  address_note: string;
  phone: string;
};

const EMPTY_FORM: AddressForm = {
  label: "",
  address: "",
  address_note: "",
  phone: "",
};

function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 0 || (digits.length >= 8 && digits.length <= 12);
}

export function AddressesClient() {
  const { state } = useStoreSession();
  const base = useStorefrontBase();
  const accountId = state.status === "account" ? state.account.id : null;
  const [addresses, setAddresses] = useState<SavedAddress[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<AddressForm>(EMPTY_FORM);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const reload = useCallback(async (accountId: string) => {
    const supabase = createClient() as SupabaseClient;
    const { data, error: loadError } = await supabase
      .from("store_account_addresses")
      .select("*")
      .eq("store_account_id", accountId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });
    if (loadError) throw loadError;
    setAddresses(data ?? []);
  }, []);

  useEffect(() => {
    if (!accountId) return;
    let cancelled = false;
    reload(accountId).catch((err) => {
      capture(err, { context: "addresses: load" });
      if (!cancelled) {
        setError("Хаяг ачаалахад алдаа гарлаа. Дахин оролдоно уу.");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [accountId, reload]);

  const startCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setFormOpen(true);
  };

  const startEdit = (addr: SavedAddress) => {
    setEditingId(addr.id);
    setForm({
      label: addr.label ?? "",
      address: addr.address ?? "",
      address_note: addr.address_note ?? "",
      phone: addr.phone ?? "",
    });
    setFormError(null);
    setFormOpen(true);
  };

  const cancelForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setFormError(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = async () => {
    if (state.status !== "account") return;
    setFormError(null);
    const label = form.label.trim();
    const address = form.address.trim();
    const addressNote = form.address_note.trim();
    const phone = form.phone.trim();
    if (!address) {
      setFormError("Хаягаа оруулна уу.");
      return;
    }
    if (!isValidPhone(phone)) {
      setFormError("Утасны дугаар 8-12 оронтой тоо байх ёстой.");
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient() as SupabaseClient;
      if (editingId) {
        const { error: updateError } = await supabase
          .from("store_account_addresses")
          .update({
            label,
            address,
            address_note: addressNote || null,
            phone: phone || null,
          })
          .eq("id", editingId);
        if (updateError) throw updateError;
        toast.success("Хаяг шинэчлэгдлээ.");
      } else {
        const { error: insertError } = await supabase
          .from("store_account_addresses")
          .insert({
            store_account_id: state.account.id,
            label,
            address,
            address_note: addressNote || null,
            phone: phone || null,
            // The first saved address becomes the default one.
            is_default: addresses !== null && addresses.length === 0,
          });
        if (insertError) throw insertError;
        toast.success("Хаяг хадгалагдлаа.");
      }
      setForm(EMPTY_FORM);
      setFormOpen(false);
      setEditingId(null);
      await reload(state.account.id);
    } catch (err) {
      capture(err, { context: "addresses: save" });
      const message =
        err && typeof err === "object" && "message" in err
          ? (err as { message: unknown }).message
          : null;
      setFormError(
        typeof message === "string" && message.trim() !== ""
          ? message
          : "Хаяг хадгалахад алдаа гарлаа. Дахин оролдоно уу.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (addr: SavedAddress) => {
    if (state.status !== "account" || addr.is_default) return;
    setBusyId(addr.id);
    try {
      const supabase = createClient() as SupabaseClient;
      const { error: clearError } = await supabase
        .from("store_account_addresses")
        .update({ is_default: false })
        .eq("store_account_id", state.account.id)
        .neq("id", addr.id);
      if (clearError) throw clearError;
      const { error } = await supabase
        .from("store_account_addresses")
        .update({ is_default: true })
        .eq("id", addr.id);
      if (error) throw error;
      toast.success("Үндсэн хаяг солигдлоо.");
      await reload(state.account.id);
    } catch (err) {
      capture(err, { context: "addresses: set default" });
      toast.error("Үндсэн хаяг солиход алдаа гарлаа.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (addr: SavedAddress) => {
    if (state.status !== "account") return;
    if (!window.confirm("Хаяг устгах уу?")) return;
    setBusyId(addr.id);
    try {
      const supabase = createClient() as SupabaseClient;
      const { error } = await supabase
        .from("store_account_addresses")
        .delete()
        .eq("id", addr.id);
      if (error) throw error;
      toast.success("Хаяг устгагдлаа.");
      // Deleting the default address promotes the next one.
      if (addr.is_default && addresses && addresses.length > 1) {
        const next = addresses.find((a) => a.id !== addr.id);
        if (next) {
          const { error: promoteError } = await supabase
            .from("store_account_addresses")
            .update({ is_default: true })
            .eq("id", next.id);
          if (promoteError) throw promoteError;
        }
      }
      await reload(state.account.id);
    } catch (err) {
      capture(err, { context: "addresses: delete" });
      toast.error("Хаяг устгахад алдаа гарлаа.");
    } finally {
      setBusyId(null);
    }
  };

  if (state.status === "loading") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (state.status === "signedOut") {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-4 py-16 text-center">
        <MapPin className="size-10 text-muted-foreground" />
        <h1 className="text-xl font-bold tracking-tight">Хаягийн дэвтэр</h1>
        <p className="text-sm text-muted-foreground">
          Хаягаа хадгалахын тулд нэвтэрнэ үү.
        </p>
        <Button asChild size="lg">
          <Link href={`${base}/account`}>Нэвтрэх</Link>
        </Button>
      </div>
    );
  }

  if (state.status === "account" && addresses === null && !error) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Хаягийн дэвтэр</h1>
          <p className="text-sm text-muted-foreground">
            Хадгалсан хаягнуудаа удирдана уу.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={startCreate}>
          <Plus className="size-4" />
          Шинэ хаяг нэмэх
        </Button>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      {formOpen && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {editingId ? "Хаяг засах" : "Шинэ хаяг"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
              className="flex flex-col gap-4"
              noValidate
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="address-label">Шошго</Label>
                <Input
                  id="address-label"
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  placeholder="Гэр, Ажил..."
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="address-address">Хаяг</Label>
                <Textarea
                  id="address-address"
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                  placeholder="СБД, 1-р хороо, 41-р байр, 12 тоот"
                  rows={2}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="address-note">Нэмэлт мэдээлэл</Label>
                <Input
                  id="address-note"
                  value={form.address_note}
                  onChange={(e) =>
                    setForm({ ...form, address_note: e.target.value })
                  }
                  placeholder="Орц, давхар, тоот"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="address-phone">Утас</Label>
                <Input
                  id="address-phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="99112233"
                  inputMode="numeric"
                />
              </div>
              {formError && (
                <p
                  role="alert"
                  className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  {formError}
                </p>
              )}
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving
                    ? "Хадгалж байна..."
                    : editingId
                      ? "Хадгалах"
                      : "Нэмэх"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={cancelForm}
                  disabled={saving}
                >
                  Болих
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {addresses !== null && addresses.length === 0 && !formOpen && (
        <div className="rounded-xl border border-dashed border-border py-16 text-center">
          <MapPin className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            Хадгалсан хаяг байхгүй байна.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {addresses?.map((addr) => (
          <Card key={addr.id} className="py-4">
            <CardContent className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {addr.label || "Хаяг"}
                  </span>
                  {addr.is_default && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      Үндсэн
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={busyId === addr.id}
                    onClick={() => startEdit(addr)}
                  >
                    <PencilSimple className="size-4" />
                    Засах
                  </Button>
                  {!addr.is_default && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={busyId === addr.id}
                      onClick={() => handleSetDefault(addr)}
                    >
                      Үндсэн болгох
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    disabled={busyId === addr.id}
                    onClick={() => handleDelete(addr)}
                  >
                    <Trash className="size-4" />
                    Устгах
                  </Button>
                </div>
              </div>
              <p className="text-sm text-foreground">{addr.address ?? "—"}</p>
              {addr.address_note && (
                <p className="text-xs text-muted-foreground">
                  Нэмэлт: {addr.address_note}
                </p>
              )}
              {addr.phone && (
                <p className="text-xs text-muted-foreground">{addr.phone}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
