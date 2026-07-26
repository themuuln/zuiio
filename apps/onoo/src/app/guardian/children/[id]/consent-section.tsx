"use client";

import { FileCheck, Loader2 } from "lucide-react";
import { useActionState, useState } from "react";
import {
  signConsentAction,
  withdrawConsentAction,
} from "@/app/lib/actions/consent-actions";
import type { ConsentInfo } from "@/app/lib/guardian-data";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Textarea,
} from "@/components/ui";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ConsentSectionProps {
  consent: ConsentInfo | null;
  studentId: string;
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

/** Client-side consent management — sign pending templates & withdraw signed ones. */
export default function ConsentSection({
  consent,
  studentId,
}: ConsentSectionProps) {
  const [signingTemplate, setSigningTemplate] = useState<{
    id: string;
    title: string;
    body: string;
  } | null>(null);
  const [withdrawingRecord, setWithdrawingRecord] = useState<string | null>(
    null,
  );

  if (!consent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="size-5" />
            Зөвшөөрлийн статус
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="default">
                <FileCheck className="size-8" />
              </EmptyMedia>
              <EmptyTitle>Зөвшөөрлийн мэдээлэл байхгүй</EmptyTitle>
              <EmptyDescription>
                Энэ хүүхдийн зөвшөөрлийн мэдээллийг авах боломжгүй байна.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    );
  }

  const hasItems = consent.signed.length > 0 || consent.pending.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileCheck className="size-5" />
          Зөвшөөрлийн статус
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasItems ? (
          <div className="flex flex-col gap-4">
            {/* Pending signatures */}
            {consent.pending.length > 0 && (
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Хүлээгдэж буй
                </h3>
                <ul className="flex flex-col gap-2">
                  {consent.pending.map((item) => (
                    <li
                      key={item.id}
                      className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-dashed p-3"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium">
                          {item.title}
                        </span>
                        <Badge variant="provisional" className="w-fit">
                          {scopeLabel(item.scope)}
                        </Badge>
                      </div>
                      <Dialog
                        open={signingTemplate?.id === item.id}
                        onOpenChange={(open) => {
                          if (!open) setSigningTemplate(null);
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() =>
                              setSigningTemplate({
                                id: item.id,
                                title: item.title,
                                body: item.body,
                              })
                            }
                          >
                            Зөвшөөрөх
                          </Button>
                        </DialogTrigger>
                        {signingTemplate?.id === item.id && (
                          <SignConsentDialog
                            template={signingTemplate}
                            studentId={studentId}
                            onClose={() => setSigningTemplate(null)}
                          />
                        )}
                      </Dialog>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Signed records */}
            {consent.signed.length > 0 && (
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Гарын үсэг зурсан
                </h3>
                <ul className="flex flex-col gap-2">
                  {consent.signed.map((item) => (
                    <li
                      key={item.id}
                      className="flex flex-wrap items-start justify-between gap-2 rounded-lg border p-3"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium">
                          {item.template_title}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(item.signed_at)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            item.is_withdrawn ? "destructive" : "verified"
                          }
                        >
                          {item.is_withdrawn ? "Татагдсан" : "Зурсан"}
                        </Badge>
                        {!item.is_withdrawn && (
                          <Dialog
                            open={withdrawingRecord === item.id}
                            onOpenChange={(open) => {
                              if (!open) setWithdrawingRecord(null);
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setWithdrawingRecord(item.id)}
                              >
                                Татах
                              </Button>
                            </DialogTrigger>
                            {withdrawingRecord === item.id && (
                              <WithdrawConsentDialog
                                recordId={item.id}
                                studentId={studentId}
                                onClose={() => setWithdrawingRecord(null)}
                              />
                            )}
                          </Dialog>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="default">
                <FileCheck className="size-8" />
              </EmptyMedia>
              <EmptyTitle>Зөвшөөрөл шаардлагагүй</EmptyTitle>
              <EmptyDescription>
                Энэ хүүхдэд зориулсан зөвшөөрлийн загвар байхгүй байна.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Sign Consent Dialog
// ---------------------------------------------------------------------------

function SignConsentDialog({
  template,
  studentId,
  onClose,
}: {
  template: { id: string; title: string; body: string };
  studentId: string;
  onClose: () => void;
}) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      try {
        const signedText = formData.get("signedText") as string | null;
        await signConsentAction(
          template.id,
          studentId,
          signedText || undefined,
        );
        onClose();
        return null;
      } catch (err) {
        return { error: err instanceof Error ? err.message : "Алдаа гарлаа" };
      }
    },
    null,
  );

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>{template.title}</DialogTitle>
        <DialogDescription>
          Зөвшөөрлийн агуулгыг уншиж, доор гарын үсгээ бичнэ үү.
        </DialogDescription>
      </DialogHeader>
      {/* Template body — with fallback for empty content */}
      <div className="max-h-60 overflow-y-auto whitespace-pre-wrap rounded-lg bg-muted p-4 text-sm leading-relaxed text-foreground">
        {template.body.trim()
          ? template.body
          : "Зөвшөөрлийн агуулга хоосон байна."}
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="signedText"
            className="text-sm font-medium text-muted-foreground"
          >
            Гарын үсэг (таны нэр)
          </label>
          <Textarea
            id="signedText"
            name="signedText"
            placeholder="Таны нэр"
            rows={2}
            required
            disabled={isPending}
          />
        </div>

        {state?.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Болих
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Зөвшөөрөх
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

// ---------------------------------------------------------------------------
// Withdraw Consent Dialog
// ---------------------------------------------------------------------------

function WithdrawConsentDialog({
  recordId,
  studentId,
  onClose,
}: {
  recordId: string;
  studentId: string;
  onClose: () => void;
}) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | null) => {
      try {
        await withdrawConsentAction(recordId, studentId);
        onClose();
        return null;
      } catch (err) {
        return {
          error: err instanceof Error ? err.message : "Алдаа гарлаа",
        };
      }
    },
    null,
  );

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Зөвшөөрлийг татах уу?</DialogTitle>
        <DialogDescription>
          Та энэ зөвшөөрлийг татсанаар хүүхдийн тань оролцоонд нөлөөлж болно.
          Энэ үйлдлийг буцаах боломжгүй.
        </DialogDescription>
      </DialogHeader>

      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Болих
        </Button>
        <form action={formAction}>
          <Button type="submit" variant="destructive" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Татах
          </Button>
        </form>
      </DialogFooter>
    </DialogContent>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function scopeLabel(scope: string): string {
  const labels: Record<string, string> = {
    liability: "Хариуцлагаас чөлөөлөх",
    medical: "Эмнэлгийн",
    media: "Медиа",
    general: "Ерөнхий",
  };
  return labels[scope] ?? scope;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  try {
    return new Intl.DateTimeFormat("mn-MN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}
