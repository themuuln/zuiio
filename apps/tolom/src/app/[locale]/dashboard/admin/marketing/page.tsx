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
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DetailDrawer } from "@/components/ui/detail-drawer";
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
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    type: "email",
  });
  const { data: adminMe, isLoading: adminMeLoading } = useAdminMe();

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
      setNewCampaign({ name: "", type: "email" });
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

  const handleCreate = useCallback(() => {
    if (!newCampaign.name) return;
    createMutation.mutate(newCampaign);
  }, [newCampaign, createMutation]);

  const handleDelete = useCallback(
    (campaignId: string) => {
      deleteMutation.mutate(campaignId);
    },
    [deleteMutation],
  );

  if (loading) {
    return (
      <div className="flex flex-col gap-6 px-4 pt-4 pb-6 md:px-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={`skeleton-${i}`} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!isAdmin) {
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
    <div className="flex flex-col gap-6 px-4 pt-4 pb-6 md:px-6">
      <div className="flex items-center justify-between">
        <div>
          <Typography.H1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Megaphone className="size-6" />
            Marketing Campaigns
          </Typography.H1>
          <Typography.Muted className="text-muted-foreground">
            Manage email, SMS, and push notification campaigns
          </Typography.Muted>
        </div>
        <Button size="sm" onClick={() => setShowCreateDialog(true)}>
          <Plus className="size-4 mr-1" />
          New Campaign
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Campaigns</CardDescription>
            <CardTitle className="text-2xl">{campaigns.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Sent</CardDescription>
            <CardTitle className="text-2xl">
              {totalSent.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Opened</CardDescription>
            <CardTitle className="text-2xl">
              {totalOpened.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Clicked</CardDescription>
            <CardTitle className="text-2xl">
              {totalClicked.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Campaigns List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Campaigns</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {campaigns.length === 0 ? (
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
                          {campaign.organization_name ?? "All organizations"} ·{" "}
                          {campaign.type.toUpperCase()}
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
                        className={STATUS_COLORS[campaign.status] ?? "bg-muted"}
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
          <div className="flex flex-col gap-4">
            <Input
              placeholder="Campaign name"
              value={newCampaign.name}
              onChange={(e) =>
                setNewCampaign((prev) => ({ ...prev, name: e.target.value }))
              }
            />
            <Select
              value={newCampaign.type}
              onValueChange={(value) =>
                setNewCampaign((prev) => ({ ...prev, type: value ?? "email" }))
              }
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
          </div>
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
    </div>
  );
}
