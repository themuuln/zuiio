"use client";

import {
  FileText,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Trash2,
  UserCheck,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateCustomerCommunication,
  useCustomerCommunications,
  useDeleteCustomerCommunication,
} from "@/lib/queries/use-communications";

const COMM_TYPES = ["call", "sms", "email", "in_person", "note"] as const;

const COMM_DIRECTIONS = ["inbound", "outbound"] as const;

const typeIcons: Record<string, React.ReactNode> = {
  call: <Phone className="size-3.5" />,
  sms: <MessageSquare className="size-3.5" />,
  email: <Mail className="size-3.5" />,
  in_person: <UserCheck className="size-3.5" />,
  note: <FileText className="size-3.5" />,
};

const typeColors: Record<string, string> = {
  call: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  sms: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  email:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  in_person:
    "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  note: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
};

const directionBadge: Record<string, string> = {
  inbound: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  outbound: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200",
};

function formatRelativeTime(
  dateStr: string,
  t: ReturnType<typeof useTranslations<"customers">>,
) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const secs = Math.floor(diff / 1000);
  const mins = Math.floor(secs / 60);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (secs < 60) return t("today");
  if (mins < 60) return `${mins}m ago`;
  if (hours < 60) return `${hours}h ago`;
  if (days === 1) return t("yesterday");
  if (days < 7) return t("daysAgo", { days });
  return new Date(dateStr).toLocaleDateString();
}

interface CommunicationLogProps {
  orgId: string | undefined;
  customerId: string | undefined;
}

export function CommunicationLog({ orgId, customerId }: CommunicationLogProps) {
  const t = useTranslations("customers");
  const commonT = useTranslations("common");

  const [type, setType] = useState<"email" | "call" | "sms" | "in_person" | "note">("call");
  const [direction, setDirection] = useState<"inbound" | "outbound">("inbound");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");

  const {
    data: communications,
    isLoading,
    error,
    refetch,
  } = useCustomerCommunications(orgId, customerId);

  const createMutation = useCreateCustomerCommunication(orgId, customerId);
  const deleteMutation = useDeleteCustomerCommunication(orgId, customerId);

  const handleSubmit = () => {
    if (!content.trim()) return;
    createMutation.mutate(
      {
        type,
        direction,
        subject: subject.trim() || undefined,
        content: content.trim(),
      },
      {
        onSuccess: () => {
          setType("call");
          setDirection("inbound");
          setSubject("");
          setContent("");
          toast.success(t("communicationLogged"));
        },
        onError: (err: Error) => toast.error(err.message),
      },
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("communicationLog")}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Add new communication form */}
        <div className="mb-6 space-y-3 rounded-lg border p-4">
          <div className="flex flex-wrap gap-2">
            <Select
              value={type}
              onValueChange={(value: string | null) => value && setType(value as any)}
            >
              <SelectTrigger className="w-[140px] shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMM_TYPES.map((ct) => (
                  <SelectItem key={ct} value={ct}>
                    <span className="flex items-center gap-2">
                      {typeIcons[ct]}
                      {t(`communicationType_${ct}`)}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={direction}
              onValueChange={(value: string | null) =>
                value && setDirection(value as any)
              }
            >
              <SelectTrigger className="w-[130px] shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMM_DIRECTIONS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {t(d === "inbound" ? "inbound" : "outbound")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t("communicationSubject")}
              className="min-w-[180px] flex-1"
            />
          </div>

          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t("communicationContent")}
            rows={2}
          />

          <Button
            onClick={handleSubmit}
            disabled={!content.trim() || createMutation.isPending}
          >
            {createMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            {t("addCommunication")}
          </Button>
        </div>

        {/* Loading state */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-lg bg-muted/50 p-3"
              >
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <p className="text-sm text-destructive">
              {error instanceof Error
                ? error.message
                : "Failed to load communications"}
            </p>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              {t("retry")}
            </Button>
          </div>
        ) : !communications || communications.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t("noCommunications")}
          </p>
        ) : (
          /* Communications list */
          <div className="space-y-3">
            {communications.map((comm) => {
              const commData = comm as {
                staff_name?: string | null;
              } & typeof comm;

              return (
                <div
                  key={comm.id}
                  className="flex items-start gap-3 rounded-lg bg-muted/50 p-3"
                >
                  <span
                    className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                      typeColors[comm.type] ?? typeColors.note
                    }`}
                  >
                    {typeIcons[comm.type] ?? typeIcons.note}
                    {t(`communicationType_${comm.type}`, {})}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                          directionBadge[comm.direction] ??
                          directionBadge.inbound
                        }`}
                      >
                        {comm.direction === "inbound"
                          ? t("inbound")
                          : t("outbound")}
                      </span>
                      {comm.subject && (
                        <span className="text-xs font-medium text-foreground">
                          {comm.subject}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm">
                      {comm.content}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {commData.staff_name || "Staff"} ·{" "}
                      {formatRelativeTime(comm.created_at, t)}
                    </p>
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      }
                    />
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {t("communicationDeleteConfirm")}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {t("communicationDeleteConfirm")}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>
                          {commonT("cancel")}
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() =>
                            deleteMutation.mutate(comm.id, {
                              onSuccess: () =>
                                toast.success(t("communicationDeleted")),
                              onError: (err: Error) => toast.error(err.message),
                            })
                          }
                        >
                          {commonT("delete")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
