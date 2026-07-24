"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";

interface AssignedScorer {
  user_id: string;
  full_name: string;
  role: string;
}

interface HandoffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gameId: string;
  sessionId: string;
  onHandoffComplete: () => void;
}

export function HandoffDialog({
  open,
  onOpenChange,
  gameId,
  sessionId,
  onHandoffComplete,
}: HandoffDialogProps) {
  const [recipients, setRecipients] = useState<AssignedScorer[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingRecipients, setLoadingRecipients] = useState(false);

  // Fetch assigned scorers when dialog opens
  useEffect(() => {
    if (!open) return;

    const supabase = createClient();

    async function loadRecipients() {
      setLoadingRecipients(true);
      try {
        const { data, error } = await supabase
          .from("game_assignments")
          .select(
            "user_id, role, profiles!game_assignments_user_id_fkey(full_name)",
          )
          .eq("game_id", gameId)
          .in("role", ["lead_scorer", "backup_scorer"]);

        if (error) throw error;

        const mapped = (data ?? []).map((row: Record<string, unknown>) => {
          const profile = row.profiles as Record<string, unknown> | null;
          return {
            user_id: row.user_id as string,
            full_name: (profile?.full_name as string) ?? "Тодорхойгүй",
            role: row.role as string,
          };
        });

        setRecipients(mapped);
      } catch (err) {
        toast.error(
          err instanceof Error
            ? err.message
            : "Хүлээн авагчдыг ачаалахад алдаа гарлаа",
        );
      } finally {
        setLoadingRecipients(false);
      }
    }

    loadRecipients();
  }, [open, gameId]);

  // Reset state on close
  useEffect(() => {
    if (!open) {
      setSelectedUserId("");
      setReason("");
    }
  }, [open]);

  async function handleHandoff() {
    if (!selectedUserId) {
      toast.error("Хүлээн авагч сонгоно уу");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data: _data, error } = await supabase.rpc("cmd_handoff_session", {
        p_session_id: sessionId,
        p_to_user_id: selectedUserId,
        p_reason: reason.trim() || null,
      });

      if (error) throw error;

      const recipient = recipients.find((r) => r.user_id === selectedUserId);
      toast.success(
        `Сессийг ${recipient?.full_name ?? "бүртгэгч"}-д шилжүүллээ`,
      );
      onOpenChange(false);
      onHandoffComplete();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Шилжүүлэхэд алдаа гарлаа",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Гар шилжүүлэх</DialogTitle>
          <DialogDescription>
            Тоглолтын бүртгэлийг өөр бүртгэгчид шилжүүлнэ. Шилжүүлсний дараа
            таны сессийг хаана.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Recipient select */}
          <div className="grid gap-2">
            <Label htmlFor="recipient">Хүлээн авагч</Label>
            <Select
              value={selectedUserId}
              onValueChange={setSelectedUserId}
              disabled={loadingRecipients || loading}
            >
              <SelectTrigger id="recipient">
                <SelectValue
                  placeholder={
                    loadingRecipients ? "Ачаалж байна..." : "Бүртгэгч сонгох"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {recipients.map((r) => (
                  <SelectItem key={r.user_id} value={r.user_id}>
                    {r.full_name}
                    <span className="ml-2 text-muted-foreground text-xs">
                      {r.role === "lead_scorer" ? "Үндсэн" : "Нөөц"}
                    </span>
                  </SelectItem>
                ))}
                {recipients.length === 0 && !loadingRecipients && (
                  <SelectItem value="__none" disabled>
                    Бүртгэгч олдсонгүй
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Reason */}
          <div className="grid gap-2">
            <Label htmlFor="handoff-reason">Шалтгаан</Label>
            <Textarea
              id="handoff-reason"
              placeholder="Шилжүүлэх шалтгаанаа бичнэ үү (сонголтоор)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={loading}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Цуцлах
          </Button>
          <Button
            variant="destructive"
            onClick={handleHandoff}
            disabled={loading || !selectedUserId}
          >
            {loading ? "Шилжүүлж байна..." : "Батлах"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
