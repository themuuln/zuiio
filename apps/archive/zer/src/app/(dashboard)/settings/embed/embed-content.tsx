"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Code, Copy, ShieldCheck, Trash, X } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { ErpEmptyState } from "@/components/erp/empty-state";
import { PageShell } from "@/components/erp/page-shell";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { createEmbedToken, revokeEmbedToken } from "./actions";

interface EmbedToken {
  id: string;
  label: string;
  scopes: string[];
  expires_at: string;
  revoked_at: string | null;
  created_at: string | null;
}

const EXPIRY_OPTIONS = [7, 30, 90, 365] as const;

type TokenStatus = "active" | "expired" | "revoked";

function tokenStatus(token: EmbedToken): TokenStatus {
  if (token.revoked_at) return "revoked";
  if (Date.parse(token.expires_at) <= Date.now()) return "expired";
  return "active";
}

export function EmbedSettingsContent({
  tokens,
  permissionDenied = false,
}: {
  tokens: EmbedToken[];
  permissionDenied?: boolean;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [newToken, setNewToken] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<EmbedToken | null>(null);
  const [isCreating, startCreate] = useTransition();
  const [isRevoking, startRevoke] = useTransition();

  const schema = z.object({
    label: z.string().min(1, t("embed.errorLabelRequired")),
    expiry_days: z.string(),
  });
  type FormValues = z.infer<typeof schema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { label: "", expiry_days: "30" },
  });

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
  const snippet = newToken
    ? `<iframe src="${siteUrl}/embed/report?token=${newToken}" width="100%" height="600" />`
    : null;

  function onSubmit(values: FormValues) {
    const formData = new FormData();
    formData.set("label", values.label);
    formData.set("expiry_days", values.expiry_days);

    startCreate(async () => {
      const result = await createEmbedToken(undefined, formData);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      if (result?.token) {
        setNewToken(result.token);
        form.reset();
        router.refresh();
        toast.success(t("embed.createdSuccess"));
      }
    });
  }

  async function copySnippet() {
    if (!snippet) return;
    try {
      await navigator.clipboard.writeText(snippet);
      toast.success(t("embed.copied"));
    } catch {
      toast.error(t("embed.errorGeneric"));
    }
  }

  function confirmRevoke() {
    if (!revokeTarget) return;
    startRevoke(async () => {
      const result = await revokeEmbedToken(revokeTarget.id);
      setRevokeTarget(null);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      router.refresh();
      toast.success(t("embed.revokedSuccess"));
    });
  }

  return (
    <PageShell title={t("embed.title")} description={t("embed.description")}>
      {permissionDenied ? (
        <Card>
          <CardContent className="flex items-center gap-3 py-8 text-sm text-muted-foreground">
            <ShieldCheck className="size-5" />
            {t("embed.permissionDenied")}
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          {/* ── Create form ── */}
          <Card>
            <CardHeader>
              <CardTitle>{t("embed.createTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col gap-4 sm:flex-row sm:items-end"
              >
                <Field className="flex-1">
                  <FieldLabel>{t("embed.label")}</FieldLabel>
                  <Input
                    placeholder={t("embed.labelPlaceholder")}
                    {...form.register("label")}
                  />
                  {form.formState.errors.label && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.label.message}
                    </p>
                  )}
                </Field>
                <Field className="w-full sm:w-48">
                  <FieldLabel>{t("embed.expiry")}</FieldLabel>
                  <NativeSelect {...form.register("expiry_days")}>
                    {EXPIRY_OPTIONS.map((days) => (
                      <NativeSelectOption key={days} value={days}>
                        {days === 365
                          ? t("embed.expiry365")
                          : t(`embed.expiry${days}`)}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </Field>
                <Button type="submit" disabled={isCreating}>
                  {t("embed.createButton")}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* ── Newly created token (shown once) ── */}
          {newToken && snippet && (
            <Card className="border-primary/40 bg-primary/5">
              <CardHeader className="flex-row items-start justify-between space-y-0">
                <CardTitle>{t("embed.generatedTitle")}</CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => setNewToken(null)}
                  title={t("embed.cancel")}
                >
                  <X className="size-4" />
                </Button>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <p className="text-sm text-muted-foreground">
                  {t("embed.generatedNote")}
                </p>
                <div className="flex flex-col gap-2">
                  <FieldLabel>{t("embed.token")}</FieldLabel>
                  <code className="block overflow-x-auto rounded-md border bg-background px-3 py-2 font-mono text-xs">
                    {newToken}
                  </code>
                </div>
                <div className="flex flex-col gap-2">
                  <FieldLabel>{t("embed.snippetLabel")}</FieldLabel>
                  <code className="block overflow-x-auto rounded-md border bg-background px-3 py-2 font-mono text-xs">
                    {snippet}
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="self-start"
                    onClick={copySnippet}
                  >
                    <Copy className="size-4" />
                    {t("embed.copySnippet")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Token list ── */}
          <Card>
            <CardHeader>
              <CardTitle>{t("embed.tokensTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              {tokens.length === 0 ? (
                <ErpEmptyState
                  icon={<Code className="size-6" />}
                  title={t("embed.empty")}
                  description={t("embed.emptyDescription")}
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("embed.label")}</TableHead>
                      <TableHead>{t("embed.created")}</TableHead>
                      <TableHead>{t("embed.expires")}</TableHead>
                      <TableHead>{t("embed.status")}</TableHead>
                      <TableHead className="text-right"> </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tokens.map((token) => {
                      const status = tokenStatus(token);
                      return (
                        <TableRow key={token.id}>
                          <TableCell className="font-medium">
                            {token.label}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {token.created_at
                              ? formatDate(token.created_at)
                              : "—"}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(token.expires_at)}
                          </TableCell>
                          <TableCell>
                            {status === "active" && (
                              <Badge>{t("embed.active")}</Badge>
                            )}
                            {status === "expired" && (
                              <Badge variant="outline">
                                {t("embed.expired")}
                              </Badge>
                            )}
                            {status === "revoked" && (
                              <Badge variant="destructive">
                                {t("embed.revoked")}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {status !== "revoked" && (
                              <AlertDialog
                                open={revokeTarget?.id === token.id}
                                onOpenChange={(open) => {
                                  if (!open) setRevokeTarget(null);
                                }}
                              >
                                <AlertDialogTrigger>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 text-muted-foreground hover:text-destructive"
                                    disabled={isRevoking}
                                    onClick={() => setRevokeTarget(token)}
                                    title={t("embed.revoke")}
                                  >
                                    <Trash className="size-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                {revokeTarget?.id === token.id && (
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        {t("embed.revokeTitle")}
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        {t("embed.revokeDescription")}
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel
                                        onClick={() => setRevokeTarget(null)}
                                      >
                                        {t("embed.cancel")}
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={confirmRevoke}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        {t("embed.revokeConfirm")}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                )}
                              </AlertDialog>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </PageShell>
  );
}
