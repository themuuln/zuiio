"use client";

import {
  ArrowDown,
  ArrowUp,
  Plus,
  Storefront,
  X,
} from "@phosphor-icons/react/dist/ssr";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { capture } from "@zuiio/capture";
import { useState } from "react";
import { toast } from "sonner";
import { ErpEmptyState } from "@/components/erp/empty-state";
import { PageShell } from "@/components/erp/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import { useOrgSettings } from "@/lib/org-settings-context";
import { createClient } from "@/lib/supabase/client";

type CashRegister = {
  id: string;
  name: string;
  is_active: boolean;
};

type CashSession = {
  id: string;
  register_id: string;
  opened_at: string;
  opening_balance: number;
  closed_at: string | null;
  closing_balance: number | null;
  actual_amount: number | null;
  difference: number | null;
  status: string;
  notes: string | null;
};

export function CashRegisterManager() {
  const { organizationId } = useOrgSettings();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [openSessionRegisterId, setOpenSessionRegisterId] = useState<
    string | null
  >(null);
  const [openingBalance, setOpeningBalance] = useState("");
  const [closeSessionId, setCloseSessionId] = useState<string | null>(null);
  const [actualAmount, setActualAmount] = useState("");

  // Fetch registers
  const registersQuery = useQuery({
    queryKey: ["cash-registers", organizationId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("cash_registers")
        .select("id, name, is_active")
        .eq("organization_id", organizationId)
        .order("name");
      if (error) throw error;
      return (data ?? []) as CashRegister[];
    },
    enabled: !!organizationId,
  });

  // Fetch open sessions
  const sessionsQuery = useQuery({
    queryKey: ["cash-sessions", organizationId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("cash_sessions")
        .select("*")
        .eq("organization_id", organizationId)
        .order("opened_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as CashSession[];
    },
    enabled: !!organizationId,
  });

  // Create register
  const createRegisterMutation = useMutation({
    mutationFn: async () => {
      const supabase = createClient();
      const { error } = await supabase.from("cash_registers").insert({
        organization_id: organizationId,
        name: newName,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash-registers"] });
      toast.success("Касс нэмэгдлээ.");
      setCreateOpen(false);
      setNewName("");
    },
    onError: (err) => {
      capture(err, { context: "cash-registers: create" });
      toast.error("Касс нэмэхэд алдаа гарлаа.");
    },
  });

  // Open session
  const openSessionMutation = useMutation({
    mutationFn: async () => {
      const supabase = createClient();
      const { error } = await supabase.from("cash_sessions").insert({
        organization_id: organizationId,
        register_id: openSessionRegisterId,
        opening_balance: Number(openingBalance) || 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash-sessions"] });
      toast.success("Касс нээгдлээ.");
      setOpenSessionRegisterId(null);
      setOpeningBalance("");
    },
    onError: (err) => {
      capture(err, { context: "cash-sessions: open" });
      toast.error("Касс нээхэд алдаа гарлаа.");
    },
  });

  // Close session
  const closeSessionMutation = useMutation({
    mutationFn: async () => {
      const supabase = createClient();
      const session = sessionsQuery.data?.find((s) => s.id === closeSessionId);
      if (!session) return;

      const actual = Number(actualAmount) || 0;
      const expected =
        Number(session.opening_balance) +
        (sessionsQuery.data
          ?.filter(
            (s) =>
              s.register_id === session.register_id &&
              s.id !== session.id &&
              new Date(s.opened_at) > new Date(session.opened_at),
          )
          .reduce((sum, s) => sum + Number(s.closing_balance ?? 0), 0) ?? 0);

      const difference = actual - expected;

      const { error } = await supabase
        .from("cash_sessions")
        .update({
          status: "closed",
          closed_at: new Date().toISOString(),
          closing_balance: actual,
          expected_amount: expected,
          actual_amount: actual,
          difference,
        })
        .eq("id", closeSessionId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash-sessions"] });
      toast.success("Касс хаагдлаа.");
      setCloseSessionId(null);
      setActualAmount("");
    },
    onError: (err) => {
      capture(err, { context: "cash-sessions: close" });
      toast.error("Касс хаахад алдаа гарлаа.");
    },
  });

  const registers = registersQuery.data ?? [];
  const sessions = sessionsQuery.data ?? [];
  const openSessions = sessions.filter((s) => s.status === "open");
  const _closedSessions = sessions.filter((s) => s.status === "closed");

  return (
    <PageShell
      title="Кассын удирдлага"
      description="Касс нээх, хаах, өдрийн тооцоо"
    >
      {/* Create register */}
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {registers.length} касс
        </span>
        <Button size="sm" onClick={() => setCreateOpen(!createOpen)}>
          <Plus className="size-4" />
          Касс нэмэх
        </Button>
      </div>

      {createOpen && (
        <Card className="mb-4 rounded-xl border-dashed">
          <CardContent className="flex items-center gap-3 pt-4">
            <Input
              placeholder="Кассны нэр *"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="flex-1"
            />
            <Button
              size="sm"
              onClick={() => createRegisterMutation.mutate()}
              disabled={!newName || createRegisterMutation.isPending}
            >
              Хадгалах
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCreateOpen(false)}
            >
              <X className="size-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {registersQuery.isPending ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : registers.length === 0 ? (
        <ErpEmptyState
          icon={<Storefront className="size-4" />}
          title="Касс бүртгэгдээгүй"
          description="Касс нэмж, өдрийн тооцоо хийнэ үү."
          action={
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              Касс нэмэх
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {registers.map((register) => {
            const registerOpenSession = openSessions.find(
              (s) => s.register_id === register.id,
            );
            const registerSessions = sessions.filter(
              (s) => s.register_id === register.id,
            );

            return (
              <Card key={register.id} className="rounded-xl">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Storefront className="size-4 text-muted-foreground" />
                    {register.name}
                    {registerOpenSession && (
                      <span className="rounded-full bg-chart-2/12 px-2 py-0.5 text-xs text-chart-2">
                        Нээлттэй
                      </span>
                    )}
                  </CardTitle>
                  <div className="flex gap-2">
                    {!registerOpenSession ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setOpenSessionRegisterId(register.id)}
                      >
                        <ArrowUp className="size-3" />
                        Нээх
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setCloseSessionId(registerOpenSession.id)
                        }
                      >
                        <ArrowDown className="size-3" />
                        хаах
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Open session form */}
                  {openSessionRegisterId === register.id && (
                    <div className="mb-3 flex items-center gap-3 rounded-lg border border-dashed p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          Нээх үеийн үлдэгдэл:
                        </span>
                        <Input
                          type="number"
                          value={openingBalance}
                          onChange={(e) => setOpeningBalance(e.target.value)}
                          className="w-32"
                          placeholder="0"
                        />
                      </div>
                      <Button
                        size="sm"
                        onClick={() => openSessionMutation.mutate()}
                        disabled={openSessionMutation.isPending}
                      >
                        Нээх
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setOpenSessionRegisterId(null)}
                      >
                        <X className="size-3" />
                      </Button>
                    </div>
                  )}

                  {/* Close session form */}
                  {closeSessionId &&
                    registerSessions.find((s) => s.id === closeSessionId) && (
                      <div className="mb-3 flex items-center gap-3 rounded-lg border border-dashed p-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            Бодит мөнгө:
                          </span>
                          <Input
                            type="number"
                            value={actualAmount}
                            onChange={(e) => setActualAmount(e.target.value)}
                            className="w-32"
                            placeholder="0"
                          />
                        </div>
                        <Button
                          size="sm"
                          onClick={() => closeSessionMutation.mutate()}
                          disabled={closeSessionMutation.isPending}
                        >
                          хаах
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setCloseSessionId(null)}
                        >
                          <X className="size-3" />
                        </Button>
                      </div>
                    )}

                  {/* Sessions list */}
                  {registerSessions.length === 0 ? (
                    <p className="py-2 text-xs text-muted-foreground">
                      Сесс байхгүй
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {registerSessions.slice(0, 5).map((session) => (
                        <div
                          key={session.id}
                          className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2 text-sm"
                        >
                          <div>
                            <span className="text-muted-foreground">
                              {new Date(session.opened_at).toLocaleDateString(
                                "mn-MN",
                              )}
                            </span>
                            <span className="ml-2 text-muted-foreground">
                              Нээх: {formatCurrency(session.opening_balance)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {session.status === "open" ? (
                              <span className="rounded-full bg-chart-2/12 px-2 py-0.5 text-xs text-chart-2">
                                Нээлттэй
                              </span>
                            ) : (
                              <>
                                <span className="text-muted-foreground">
                                  хаах:{" "}
                                  {formatCurrency(session.closing_balance ?? 0)}
                                </span>
                                {session.difference !== null &&
                                  session.difference !== 0 && (
                                    <span
                                      className={`rounded-full px-2 py-0.5 text-xs ${
                                        session.difference > 0
                                          ? "bg-chart-2/12 text-chart-2"
                                          : "bg-destructive/10 text-destructive"
                                      }`}
                                    >
                                      {session.difference > 0 ? "+" : ""}
                                      {formatCurrency(session.difference)}
                                    </span>
                                  )}
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
