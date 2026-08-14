"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  Mail,
  Megaphone,
  Plus,
  ShieldAlert,
  Smartphone,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { ListPageShell } from "@/components/list-page-shell";
import { StatCard, StatCards } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DetailDrawer } from "@/components/ui/detail-drawer";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";
import { useForm, zodResolver } from "@/lib/hooks/use-form";
import { useAdminMe } from "@/lib/queries/use-admin";

interface Campaign {
  id: string;
  organization_id: string | null;
  organization_name?: string;
  name: string;
  type: string;
  status: string;
  target_count: number;
  sent_count: number;
  opened_count: number;
  clicked_count: number;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  sending:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  sent: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const TYPE_ICONS: Record<string, typeof Mail> = {
  email: Mail,
  sms: Smartphone,
  push: Megaphone,
  all: Megaphone,
};

export default function MarketingPage() {
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { data: adminMe, isLoading: adminMeLoading } = useAdminMe();
  const campaignSchema = z.object({
    name: z.string().min(1, "Campaign name is required"),
    type: z.string().min(1),
  });

  const form = useForm({
    resolver: zodResolver(campaignSchema),
    defaultValues: { name: "", type: "email" },
  });

  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery<
    Campaign[]
  >({
    queryKey: ["admin", "campaigns"],
    queryFn: async () => {
      const res = await fetch("/api/admin/marketing/campaigns");
      const json = await res.json();
      return json.data ?? [];
    },
    enabled: adminMe?.isAdmin === true,
  });

  const createMutation = useMutation({
    mutationFn: async (campaign: { name: string; type: string }) => {
      const res = await fetch("/api/admin/marketing/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(campaign),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return json;
    },
    onSuccess: () => {
      toast.success("Campaign created");
      queryClient.invalidateQueries({ queryKey: ["admin", "campaigns"] });
      setShowCreateDialog(false);
      form.reset();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to create");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (campaignId: string) => {
      const res = await fetch(`/api/admin/marketing/campaigns/${campaignId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      return json;
    },
    onSuccess: () => {
      toast.success("Campaign deleted");
      queryClient.invalidateQueries({ queryKey: ["admin", "campaigns"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    },
  });

  const loading = adminMeLoading || campaignsLoading;
  const isAdmin = adminMe?.isAdmin === true;

  const handleCreate = form.handleSubmit((data) => {
    createMutation.mutate(data);
  });

  const handleDelete = useCallback(
    (campaignId: string) => {
      deleteMutation.mutate(campaignId);
    },
    [deleteMutation],
  );
  useEffect(() => {
    if (showCreateDialog) {
      form.reset();
    }
  }, [showCreateDialog, form]);

  if (!loading && !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <ShieldAlert className="size-10 text-destructive" />
        <Typography.H2 className="text-xl font-semibold">
          Access Denied
        </Typography.H2>
        <Typography.Muted className="text-muted-foreground text-center max-w-md">
          You need marketing manager access to view this page.
        </Typography.Muted>
      </div>
    );
  }

  const totalSent = campaigns.reduce((sum, c) => sum + c.sent_count, 0);
  const totalOpened = campaigns.reduce((sum, c) => sum + c.opened_count, 0);
  const totalClicked = campaigns.reduce((sum, c) => sum + c.clicked_count, 0);

  return (
    <div className="px-4 pt-4 pb-6 md:px-6">
      <ListPageShell
        title={
          <span className="flex items-center gap-2">
            <Megaphone className="size-6" />
            Marketing Campaigns
          </span>
        }
        description="Manage email, SMS, and push notification campaigns"
        headerAction={
          <Button size="sm" onClick={() => setShowCreateDialog(true)}>
            <Plus className="size-4 mr-1" />
            New Campaign
          </Button>
        }
      >
        {/* Stats */}
        <StatCards>
          <StatCard
            label="Total Campaigns"
            value={campaigns.length}
            loading={loading}
          />
          <StatCard
            label="Sent"
            value={totalSent.toLocaleString()}
            loading={loading}
          />
          <StatCard
            label="Opened"
            value={totalOpened.toLocaleString()}
            loading={loading}
          />
          <StatCard
            label="Clicked"
            value={totalClicked.toLocaleString()}
            loading={loading}
          />
        </StatCards>

        {/* Campaigns List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Campaigns</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {loading ? (
                [1, 2, 3].map((i) => (
                  <div
                    key={`sk-campaign-${i}`}
                    className="flex items-center justify-between px-6 py-4"
                  >
                    <div className="flex items-center gap-3">
                      <Skeleton className="size-4 rounded-full" />
                      <div className="flex flex-col gap-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                      <Skeleton className="size-7" />
                    </div>
                  </div>
                ))
              ) : campaigns.length === 0 ? (
                <div className="px-6 py-12 text-center text-sm text-muted-foreground">
                  No campaigns yet. Create your first campaign to get started.
                </div>
              ) : (
                campaigns.map((campaign) => {
                  const TypeIcon = TYPE_ICONS[campaign.type] ?? Mail;
                  return (
                    <div
                      key={campaign.id}
                      className="flex items-center justify-between px-6 py-4"
                    >
                      <div className="flex items-center gap-3">
                        <TypeIcon className="size-4 text-muted-foreground" />
                        <div>
                          <Typography.Text className="text-sm font-medium">
                            {campaign.name}
                          </Typography.Text>
                          <Typography.Muted className="text-xs text-muted-foreground">
                            {campaign.organization_name ?? "All organizations"}{" "}
                            · {campaign.type.toUpperCase()}
                          </Typography.Muted>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right text-xs text-muted-foreground">
                          <span>{campaign.sent_count} sent</span>
                          <span className="mx-1">·</span>
                          <span>{campaign.opened_count} opened</span>
                        </div>
                        <Badge
                          className={
                            STATUS_COLORS[campaign.status] ?? "bg-muted"
                          }
                          variant="secondary"
                        >
                          {campaign.status}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-destructive"
                          onClick={() => handleDelete(campaign.id)}
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Create Dialog */}
        <DetailDrawer
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          size="lg"
        >
          <DetailDrawer.Header>
            <DetailDrawer.Title>Create Campaign</DetailDrawer.Title>
            <DetailDrawer.Description>
              Create a new marketing campaign.
            </DetailDrawer.Description>
          </DetailDrawer.Header>
          <DetailDrawer.Body>
            <FieldGroup>
              <Field data-invalid={!!form.formState.errors.name}>
                <FieldLabel>
                  Campaign Name <span className="text-destructive">*</span>
                </FieldLabel>
                <FieldContent>
                  <Input
                    placeholder="Campaign name"
                    {...form.register("name")}
                  />
                  {form.formState.errors.name && (
                    <FieldError>
                      {form.formState.errors.name.message}
                    </FieldError>
                  )}
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel>Type</FieldLabel>
                <FieldContent>
                  <Select
                    value={form.watch("type")}
                    onValueChange={(v) => form.setValue("type", v ?? "email")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="push">Push Notification</SelectItem>
                      <SelectItem value="all">All Channels</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>
            </FieldGroup>
          </DetailDrawer.Body>
          <DetailDrawer.Footer>
            <DetailDrawer.FooterActions>
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreate} size="lg">
                {createMutation.isPending && (
                  <Loader2 className="size-4 mr-1 animate-spin" />
                )}
                Create
              </Button>
            </DetailDrawer.FooterActions>
          </DetailDrawer.Footer>
        </DetailDrawer>
      </ListPageShell>
    </div>
  );
}
