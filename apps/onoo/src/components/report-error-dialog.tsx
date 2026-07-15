"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface ReportErrorDialogProps {
  gameId?: string;
  playerId?: string;
}

export function ReportErrorDialog({ gameId, playerId }: ReportErrorDialogProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const charCount = message.length;
  const isValid = charCount >= 5 && charCount <= 500;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/report-error", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game_id: gameId ?? null,
          player_id: playerId ?? null,
          message,
          contact: contact || null,
        }),
      });

      if (res.status === 201) {
        toast.success("Мэдээлсэнд баярлалаа");
        setOpen(false);
        setMessage("");
        setContact("");
      } else if (res.status === 429) {
        toast.error(
          "Өнөөдөр хэт олон мэдээлэл илгээсэн. Маргааш дахин оролдоно уу.",
        );
      } else {
        const data = await res.json().catch(() => null);
        toast.error(data?.error ?? "Алдаа гарлаа. Дахин оролдоно уу.");
      }
    } catch {
      toast.error("Сүлжээний алдаа. Дахин оролдоно уу.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Алдаа мэдээлэх">
          <Flag className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Статистик алдаа мэдээлэх</DialogTitle>
            <DialogDescription>
              Буруу тоо баримт эсвэл алдааг мэдээлнэ үү. Бид шалгаж засна.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="report-message">
                Алдааны талаархи тайлбар *
              </Label>
              <Textarea
                id="report-message"
                placeholder="Ямар алдаа байгааг тайлбарлана уу..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                aria-describedby="message-hint"
              />
              <p
                id="message-hint"
                className="text-xs text-muted-foreground text-right"
              >
                {charCount}/500
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="report-contact">Холбоо барих (заавал биш)</Label>
              <Input
                id="report-contact"
                type="text"
                placeholder="Утас эсвэл имэйл"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Цуцлах
              </Button>
            </DialogClose>
            <Button type="submit" disabled={!isValid || submitting}>
              {submitting ? "Илгээж байна..." : "Илгээх"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
