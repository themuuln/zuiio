"use client";

import { Plus, Trash, Wallet } from "@phosphor-icons/react/dist/ssr";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { capture } from "@zuiio/capture";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useOrgSettings } from "@/lib/org-settings-context";
import { createClient } from "@/lib/supabase/client";

type BankAccount = {
  id: string;
  name: string;
  bank_name: string | null;
  account_number: string | null;
  account_type: string;
  is_default: boolean;
  is_active: boolean;
};

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  bank: "Банк",
  cash: "Бэлэн мөнгө",
  mobile: "Мобайл",
};

export function BankAccountsSettings() {
  const { organizationId } = useOrgSettings();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newBankName, setNewBankName] = useState("");
  const [newAccountNumber, setNewAccountNumber] = useState("");
  const [newType, setNewType] = useState("bank");

  const accountsQuery = useQuery({
    queryKey: ["settings", "bank-accounts", organizationId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("bank_accounts")
        .select("*")
        .eq("organization_id", organizationId)
        .order("is_default", { ascending: false })
        .order("name");
      if (error) throw error;
      return (data ?? []) as BankAccount[];
    },
    enabled: !!organizationId,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const supabase = createClient();
      const { error } = await supabase.from("bank_accounts").insert({
        organization_id: organizationId,
        name: newName,
        bank_name: newBankName || null,
        account_number: newAccountNumber || null,
        account_type: newType,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["settings", "bank-accounts"],
      });
      toast.success("Данс нэмэгдлээ.");
      setCreateOpen(false);
      setNewName("");
      setNewBankName("");
      setNewAccountNumber("");
      setNewType("bank");
    },
    onError: (err) => {
      capture(err, { context: "bank-accounts: create" });
      toast.error("Данс нэмэхэд алдаа гарлаа.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("bank_accounts")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["settings", "bank-accounts"],
      });
      toast.success("Данс устгагдлаа.");
    },
    onError: (err) => {
      capture(err, { context: "bank-accounts: delete" });
      toast.error("Данс устгахад алдаа гарлаа.");
    },
  });

  const toggleDefaultMutation = useMutation({
    mutationFn: async ({
      id,
      isDefault,
    }: {
      id: string;
      isDefault: boolean;
    }) => {
      const supabase = createClient();
      // If setting as default, unset all others first
      if (isDefault) {
        await supabase
          .from("bank_accounts")
          .update({ is_default: false })
          .eq("organization_id", organizationId);
      }
      const { error } = await supabase
        .from("bank_accounts")
        .update({ is_default: isDefault })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["settings", "bank-accounts"],
      });
    },
    onError: (err) => {
      capture(err, { context: "bank-accounts: toggle default" });
    },
  });

  const accounts = accountsQuery.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Дансны удирдлага</h3>
          <p className="text-xs text-muted-foreground">
            Банк, бэлэн мөнгө, мобайл дансууд
          </p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(!createOpen)}>
          <Plus className="size-4" />
          Данс нэмэх
        </Button>
      </div>

      {createOpen && (
        <Card className="rounded-xl border-dashed">
          <CardContent className="space-y-3 pt-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Дансны нэр *"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                className="rounded-lg border bg-background px-3 py-2 text-sm"
              >
                <option value="bank">Банк</option>
                <option value="cash">Бэлэн мөнгө</option>
                <option value="mobile">Мобайл</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Банкны нэр"
                value={newBankName}
                onChange={(e) => setNewBankName(e.target.value)}
              />
              <Input
                placeholder="Дансны дугаар"
                value={newAccountNumber}
                onChange={(e) => setNewAccountNumber(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCreateOpen(false)}
              >
                Цуцлах
              </Button>
              <Button
                size="sm"
                onClick={() => createMutation.mutate()}
                disabled={!newName || createMutation.isPending}
              >
                {createMutation.isPending ? "Үүсгэж байна..." : "Хадгалах"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {accountsQuery.isPending ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : accounts.length === 0 ? (
        <Card className="rounded-xl">
          <CardContent className="flex flex-col items-center py-8 text-center">
            <Wallet className="mb-2 size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Данс бүртгэгдээгүй байна
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {accounts.map((account) => (
            <Card key={account.id} className="rounded-xl">
              <CardContent className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Wallet className="size-4 text-muted-foreground" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {account.name}
                      </span>
                      {account.is_default && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                          Үндсэн
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {ACCOUNT_TYPE_LABELS[account.account_type] ??
                        account.account_type}
                      {account.bank_name && ` · ${account.bank_name}`}
                      {account.account_number && ` · ${account.account_number}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={account.is_default}
                    onCheckedChange={(checked) =>
                      toggleDefaultMutation.mutate({
                        id: account.id,
                        isDefault: checked,
                      })
                    }
                    aria-label="Үндсэн данс"
                  />
                  {!account.is_default && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm("Энэ дансыг устгах уу?")) {
                          deleteMutation.mutate(account.id);
                        }
                      }}
                      className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash className="size-3.5" />
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
