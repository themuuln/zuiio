"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  CheckCircle,
  Clock,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  User,
  XCircle,
} from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  followupKeys,
  useCreateFollowup,
  useUpdateFollowup,
} from "@/lib/queries/use-followups";

// ── Types ──────────────────────────────────────────────────────

interface FollowupItem {
  id: string;
  subject: string;
  type: string;
  status: string;
  due_at: string;
  notes: string | null;
  outcome: string | null;
}

interface CustomerFollowupsSectionProps {
  orgId: string;
  customerId: string;
}

// ── Helpers ────────────────────────────────────────────────────

const TYPE_ICONS: Record<string, React.ReactNode> = {
  call: <Phone className="size-3.5" />,
  email: <Mail className="size-3.5" />,
  message: <MessageSquare className="size-3.5" />,
  visit: <User className="size-3.5" />,
  other: <Calendar className="size-3.5" />,
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock className="size-3.5 text-amber-500" />,
  completed: <CheckCircle className="size-3.5 text-emerald-500" />,
  cancelled: <XCircle className="size-3.5 text-muted-foreground" />,
  skipped: <XCircle className="size-3.5 text-muted-foreground" />,
};

function formatDueDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const isPast = date < now;

  const formatted = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return isPast ? `${formatted} (overdue)` : formatted;
}

// ── Component ──────────────────────────────────────────────────

export function CustomerFollowupsSection({
  orgId,
  customerId,
}: CustomerFollowupsSectionProps) {
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading } = useQuery<{
    data: FollowupItem[];
    count: number;
  }>({
    queryKey: followupKeys.list({ customerId, status: "pending" }),
    queryFn: async () => {
      const res = await fetch(
        `/api/organizations/${orgId}/followups?customerId=${customerId}&status=pending&limit=10`,
      );
      if (!res.ok) throw new Error("Failed to fetch follow-ups");
      return res.json();
    },
  });

  const followups = data?.data ?? [];

  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Pending Follow-ups ({followups.length})
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs"
          onClick={() => setShowCreate(true)}
        >
          + Add
        </Button>
      </div>

      {isLoading ? (
        <div className="mt-2 flex items-center justify-center py-4">
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        </div>
      ) : followups.length === 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">
          No pending follow-ups
        </p>
      ) : (
        <div className="mt-2 flex flex-col gap-1.5">
          {followups.map((fu) => (
            <FollowupRow key={fu.id} followup={fu} orgId={orgId} />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateFollowupDialog
          orgId={orgId}
          customerId={customerId}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}

// ── Follow-up Row ──────────────────────────────────────────────

function FollowupRow({
  followup,
  orgId,
}: {
  followup: FollowupItem;
  orgId: string;
}) {
  const updateMutation = useUpdateFollowup(orgId);

  const handleComplete = useCallback(() => {
    updateMutation.mutate(
      {
        followupId: followup.id,
        action: "complete",
        outcome: "Completed",
      },
      {
        onSuccess: () => toast.success("Follow-up completed"),
        onError: () => toast.error("Failed to complete follow-up"),
      },
    );
  }, [followup.id, updateMutation]);

  return (
    <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm">
      <span className="text-muted-foreground">
        {TYPE_ICONS[followup.type] ?? TYPE_ICONS.other}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{followup.subject}</p>
        <p className="text-[10px] text-muted-foreground">
          {formatDueDate(followup.due_at)}
        </p>
      </div>
      <span className="text-muted-foreground">
        {STATUS_ICONS[followup.status] ?? STATUS_ICONS.pending}
      </span>
      {followup.status === "pending" && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs"
          onClick={handleComplete}
          disabled={updateMutation.isPending}
        >
          Done
        </Button>
      )}
    </div>
  );
}

// ── Create Dialog ──────────────────────────────────────────────

function CreateFollowupDialog({
  orgId,
  customerId,
  onClose,
}: {
  orgId: string;
  customerId: string;
  onClose: () => void;
}) {
  const createMutation = useCreateFollowup(orgId);

  const [form, setForm] = useState({
    type: "call",
    subject: "",
    notes: "",
    due_at: "",
  });

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!form.subject.trim() || !form.due_at) {
        toast.error("Subject and due date are required");
        return;
      }

      createMutation.mutate(
        {
          customer_id: customerId,
          type: form.type,
          subject: form.subject,
          notes: form.notes || undefined,
          due_at: new Date(form.due_at).toISOString(),
        },
        {
          onSuccess: () => {
            toast.success("Follow-up created");
            onClose();
          },
          onError: () => toast.error("Failed to create follow-up"),
        },
      );
    },
    [form, customerId, createMutation, onClose],
  );

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Follow-up</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label>Type</Label>
            <Select
              value={form.type}
              onValueChange={(v) => setForm((p) => ({ ...p, type: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="call">Call</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="message">Message</SelectItem>
                <SelectItem value="visit">Visit</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Subject *</Label>
            <Input
              placeholder="e.g. Callback about brake quote"
              value={form.subject}
              onChange={(e) =>
                setForm((p) => ({ ...p, subject: e.target.value }))
              }
              required
            />
          </div>
          <div className="grid gap-2">
            <Label>Due Date *</Label>
            <Input
              type="datetime-local"
              value={form.due_at}
              onChange={(e) =>
                setForm((p) => ({ ...p, due_at: e.target.value }))
              }
              required
            />
          </div>
          <div className="grid gap-2">
            <Label>Notes</Label>
            <Textarea
              placeholder="Additional details..."
              value={form.notes}
              onChange={(e) =>
                setForm((p) => ({ ...p, notes: e.target.value }))
              }
              rows={2}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Create"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
