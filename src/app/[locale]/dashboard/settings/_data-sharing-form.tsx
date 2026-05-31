"use client";

import { Info, Shield } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Typography } from "@/components/ui/typography";
import type { Organization } from "@/lib/types";

interface DataSharingFormProps {
  organization: Organization | undefined;
  onRefetch: () => void;
}

export function DataSharingForm({
  organization,
  onRefetch,
}: DataSharingFormProps) {
  const [sharingEnabled, setSharingEnabled] = useState(
    organization?.sharing_enabled ?? false,
  );
  const [saving, setSaving] = useState(false);

  const handleToggle = useCallback(
    async (checked: boolean) => {
      if (!organization) return;

      setSaving(true);
      try {
        const res = await fetch(`/api/organizations/${organization.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sharingEnabled: checked }),
        });

        const json = await res.json();
        if (!res.ok || json.error) {
          throw new Error(
            json.error?.message ?? "Failed to update sharing settings",
          );
        }

        setSharingEnabled(checked);
        onRefetch();
        toast.success(
          checked
            ? "Data sharing enabled — other organizations can now view your customer data"
            : "Data sharing disabled — your data is now private",
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update";
        toast.error(message);
        setSharingEnabled(!checked); // revert
      } finally {
        setSaving(false);
      }
    },
    [organization, onRefetch],
  );

  if (!organization) {
    return (
      <Card>
        <CardContent className="flex flex-col gap-3 pt-6">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-72" />
          <Skeleton className="h-10 w-24" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col gap-4 pt-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <Typography.Text className="font-medium">
                Share customer & vehicle data
              </Typography.Text>
              <Typography.Muted className="text-sm text-muted-foreground">
                When enabled, other organizations on the network can view your
                customers, vehicles, and service history.
              </Typography.Muted>
            </div>
            <Switch
              checked={sharingEnabled}
              onCheckedChange={handleToggle}
              disabled={saving}
            />
          </div>

          <Separator />

          <div className="flex flex-col gap-3">
            <Typography.Text className="text-sm font-medium">
              What gets shared
            </Typography.Text>
            <div className="grid gap-2 sm:grid-cols-2">
              <SharedItem
                label="Customer profiles"
                description="Name, phone, email, address"
              />
              <SharedItem
                label="Vehicle details"
                description="Plate, make, model, VIN, odometer"
              />
              <SharedItem
                label="Service history"
                description="Work orders, services, parts used"
              />
              <SharedItem
                label="Invoices & payments"
                description="Billing records and payment status"
              />
            </div>
          </div>

          <Separator />

          <div className="flex flex-col gap-2">
            <Typography.Text className="text-sm font-medium">
              Access rules
            </Typography.Text>
            <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
              <li>
                • Other organizations can only <strong>view</strong> your data —
                they cannot edit or delete it
              </li>
              <li>• Your own staff retain full access as normal</li>
              <li>
                • You can disable sharing at any time — the change takes effect
                immediately
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Alert variant="default">
        <Info className="size-4" />
        <AlertTitle>About data sharing</AlertTitle>
        <AlertDescription>
          Data sharing is an opt-in feature. Your customer and vehicle data is
          private by default. When you enable sharing, other auto service
          businesses on the TOLOM network can look up a customer&apos;s service
          history across all participating shops. This helps mechanics make
          better decisions when a customer visits a new shop.
        </AlertDescription>
      </Alert>
    </div>
  );
}

function SharedItem({
  label,
  description,
}: {
  label: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-2 rounded-md border p-3">
      <Shield className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div>
        <Typography.Text className="text-sm font-medium">
          {label}
        </Typography.Text>
        <Typography.Muted className="text-xs text-muted-foreground">
          {description}
        </Typography.Muted>
      </div>
    </div>
  );
}
