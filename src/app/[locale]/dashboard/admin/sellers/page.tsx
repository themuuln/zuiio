"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Loader2, Plus, ShieldAlert, Users, X } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Typography } from "@/components/ui/typography";

interface AdminMe {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  role: string | null;
}

interface Org {
  id: string;
  name: string;
  slug: string;
  subscription?: { plan_type: string; status: string; trial?: boolean } | null;
}

interface Assignment {
  id: string;
  seller_id: string;
  organization_id: string;
  organization_name?: string;
  organization_slug?: string;
  created_at: string;
}

export default function SellersPage() {
  const queryClient = useQueryClient();
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [assigning, setAssigning] = useState(false);

  const { data: meData, isLoading: meLoading } = useQuery<AdminMe>({
    queryKey: ["admin", "me"],
    queryFn: async () => {
      const res = await fetch("/api/admin/me");
      const json = await res.json();
      return json.data;
    },
  });

  const { data: sellerData, isLoading: sellersLoading } = useQuery({
    queryKey: ["admin", "sellers"],
    queryFn: async () => {
      const res = await fetch("/api/admin/sellers");
      const json = await res.json();
      return json.data;
    },
    enabled: meData?.isAdmin === true,
  });

  const loading = meLoading || sellersLoading;
  const isAdmin = meData?.isAdmin === true;
  const isSuperAdmin = meData?.isSuperAdmin === true;
  const organizations: Org[] = sellerData?.organizations ?? [];
  const assignments: Assignment[] = sellerData?.assignments ?? [];

  const handleAssign = useCallback(async () => {
    if (!selectedOrgId) return;
    setAssigning(true);
    try {
      const res = await fetch("/api/admin/sellers/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organization_id: selectedOrgId }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      toast.success("Organization assigned");
      queryClient.invalidateQueries({ queryKey: ["admin", "sellers"] });
      setShowAssignDialog(false);
      setSelectedOrgId("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to assign");
    } finally {
      setAssigning(false);
    }
  }, [selectedOrgId, queryClient]);

  const handleRemove = useCallback(
    async (assignmentId: string) => {
      try {
        const res = await fetch(`/api/admin/sellers/assign/${assignmentId}`, {
          method: "DELETE",
        });
        const json = await res.json();
        if (json.error) throw new Error(json.error.message);
        toast.success("Assignment removed");
        queryClient.invalidateQueries({ queryKey: ["admin", "sellers"] });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to remove");
      }
    },
    [queryClient],
  );

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={`skeleton-${i}`} className="h-32 w-full" />
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
          You need admin access to view this page.
        </Typography.Muted>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <Typography.H1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Users className="size-6" />
            Seller Management
          </Typography.H1>
          <Typography.Muted className="text-muted-foreground">
            {isSuperAdmin
              ? "Manage sellers and their organization assignments"
              : "View your assigned organizations"}
          </Typography.Muted>
        </div>
        {isSuperAdmin && (
          <Button size="sm" onClick={() => setShowAssignDialog(true)}>
            <Plus className="size-4 mr-1" />
            Assign Org
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Assigned Organizations</CardDescription>
            <CardTitle className="text-2xl">{organizations.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Subscriptions</CardDescription>
            <CardTitle className="text-2xl">
              {
                organizations.filter((o) => o.subscription?.status === "active")
                  .length
              }
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Trial Organizations</CardDescription>
            <CardTitle className="text-2xl">
              {organizations.filter((o) => o.subscription?.trial).length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Organizations List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Organizations</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {organizations.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-muted-foreground">
                No organizations assigned yet.
              </div>
            ) : (
              organizations.map((org) => {
                const assignment = assignments.find(
                  (a) => a.organization_id === org.id,
                );
                return (
                  <div
                    key={org.id}
                    className="flex items-center justify-between px-6 py-4"
                  >
                    <div className="flex items-center gap-3">
                      <Building2 className="size-4 text-muted-foreground" />
                      <div>
                        <Typography.Text className="text-sm font-medium">
                          {org.name}
                        </Typography.Text>
                        <Typography.Muted className="text-xs text-muted-foreground">
                          {org.slug}
                        </Typography.Muted>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {org.subscription && (
                        <Badge variant="secondary" className="text-xs">
                          {org.subscription.plan_type}
                        </Badge>
                      )}
                      {isSuperAdmin && assignment && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleRemove(assignment.id)}
                        >
                          <X className="size-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Assign Dialog */}
      <DetailDrawer
        open={showAssignDialog}
        onOpenChange={setShowAssignDialog}
        size="lg"
      >
        <DetailDrawer.Header>
          <DetailDrawer.Title>Assign Organization</DetailDrawer.Title>
          <DetailDrawer.Description>
            Select an organization to assign to this seller.
          </DetailDrawer.Description>
        </DetailDrawer.Header>
        <DetailDrawer.Body>
          <Select
            value={selectedOrgId}
            onValueChange={(v) => setSelectedOrgId(v ?? "")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select organization" />
            </SelectTrigger>
            <SelectContent>
              {organizations.map((org) => (
                <SelectItem key={org.id} value={org.id}>
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </DetailDrawer.Body>
        <DetailDrawer.Footer>
          <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={!selectedOrgId || assigning}>
            {assigning && <Loader2 className="size-4 mr-1 animate-spin" />}
            Assign
          </Button>
        </DetailDrawer.Footer>
      </DetailDrawer>
    </div>
  );
}
