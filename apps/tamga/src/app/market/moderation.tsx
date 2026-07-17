import { useState } from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Loading } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/states";
import { formatDistanceToNow } from "date-fns";
import { mn } from "date-fns/locale";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ListingReport {
  id: string;
  listing_id: string;
  reporter_id: string;
  reason: string;
  status: "pending" | "approved" | "removed" | "warned";
  created_at: string;
  listings: { title: string; horse_name: string } | null;
  reporter: { display_name: string } | null;
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

function useListingReports() {
  return useQuery<ListingReport[]>({
    queryKey: ["listing-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listing_reports")
        .select(
          "*, listings(title, horse_name), reporter:profiles!listing_reports_reporter_id_fkey(display_name)"
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as ListingReport[]) ?? [];
    },
  });
}

function useReportMutations() {
  const qc = useQueryClient();

  const updateStatus = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: "approved" | "removed" | "warned";
    }) => {
      const { error } = await supabase
        .from("listing_reports")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["listing-reports"] });
    },
  });

  return { updateStatus };
}

// ---------------------------------------------------------------------------
// Stats bar
// ---------------------------------------------------------------------------

function StatsBar({ reports }: { reports: ListingReport[] }) {
  const total = reports.length;
  const pending = reports.filter((r) => r.status === "pending").length;
  const resolved = reports.filter(
    (r) => r.status !== "pending"
  ).length;

  const stats = [
    { label: "Нийт", value: total, color: "text-foreground" },
    { label: "Хүлээгдэж буй", value: pending, color: "text-amber-500" },
    { label: "Шийдвэрлэсэн", value: resolved, color: "text-emerald-500" },
  ];

  return (
    <View className="flex-row mx-4 mb-4 gap-2">
      {stats.map((s) => (
        <View key={s.label} className="flex-1 bg-card rounded-xl p-3 border border-border items-center">
          <Text className={`text-2xl font-bold ${s.color}`}>{s.value}</Text>
          <Text className="text-muted-foreground text-xs mt-1">{s.label}</Text>
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Tab toggle
// ---------------------------------------------------------------------------

type Tab = "pending" | "all";

// ---------------------------------------------------------------------------
// Report card
// ---------------------------------------------------------------------------

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "success" | "warning" }> = {
  pending: { label: "Хүлээгдэж буй", variant: "warning" },
  approved: { label: "Цэвэрлэсэн", variant: "success" },
  removed: { label: "Устгасан", variant: "destructive" },
  warned: { label: "Анхааруулсан", variant: "secondary" },
};

function ReportCard({
  report,
  onApprove,
  onRemove,
  onWarn,
}: {
  report: ListingReport;
  onApprove: () => void;
  onRemove: () => void;
  onWarn: () => void;
}) {
  const listing = report.listings;
  const reporter = report.reporter;
  const statusInfo = STATUS_MAP[report.status] ?? STATUS_MAP.pending;

  return (
    <Card className="mb-3">
      {/* Header row */}
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1 mr-2">
          <Text className="text-foreground font-semibold" numberOfLines={1}>
            {listing?.title ?? "Зар олдсонгүй"}
          </Text>
          {listing?.horse_name && (
            <Text className="text-muted-foreground text-xs mt-0.5">
              {listing.horse_name}
            </Text>
          )}
        </View>
        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
      </View>

      {/* Reporter */}
      <View className="flex-row items-center gap-1 mb-1">
        <Ionicons name="person-outline" size={14} className="text-muted-foreground" />
        <Text className="text-muted-foreground text-sm">
          {reporter?.display_name ?? "Нэргүй"}
        </Text>
      </View>

      {/* Reason */}
      <Text className="text-foreground text-sm mb-2">{report.reason}</Text>

      {/* Date */}
      <Text className="text-muted-foreground text-xs mb-3">
        {formatDistanceToNow(new Date(report.created_at), {
          addSuffix: true,
          locale: mn,
        })}
      </Text>

      {/* Actions — only for pending */}
      {report.status === "pending" && (
        <View className="flex-row gap-2">
          <View className="flex-1">
            <Button
              title="Цэвэрлэх"
              variant="secondary"
              onPress={onApprove}
            />
          </View>
          <View className="flex-1">
            <Button
              title="Устгах"
              variant="destructive"
              onPress={onRemove}
            />
          </View>
          <View className="flex-1">
            <Button
              title="Анхааруулга"
              variant="primary"
              onPress={onWarn}
            />
          </View>
        </View>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function ModerationScreen() {
  const [tab, setTab] = useState<Tab>("pending");
  const { data: reports = [], isPending, error, refetch } = useListingReports();
  const { updateStatus } = useReportMutations();

  const filtered =
    tab === "pending"
      ? reports.filter((r) => r.status === "pending")
      : reports;

  return (
    <View className="flex-1 bg-background">
      <PageHeader
        title="Зах зээлийн хяналт"
        subtitle="Мэдээлсэн зарууд"
        showBack
      />

      {isPending ? (
        <Loading />
      ) : error ? (
        <ErrorState onRetry={refetch} />
      ) : (
        <>
          {/* Stats */}
          <StatsBar reports={reports} />

          {/* Tab toggle */}
          <View className="flex-row bg-card mx-4 rounded-xl p-1 mb-4">
            {([
              { key: "pending" as const, label: "Хүлээгдэж буй" },
              { key: "all" as const, label: "Бүгд" },
            ]).map((t) => (
              <TouchableOpacity
                key={t.key}
                className={`flex-1 py-2 rounded-lg ${tab === t.key ? "bg-primary" : ""}`}
                onPress={() => setTab(t.key)}
              >
                <Text
                  className={`text-center text-sm font-medium ${tab === t.key ? "text-primary-foreground" : "text-muted-foreground"}`}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Report list */}
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            contentContainerClassName="px-4 pb-20"
            renderItem={({ item }) => (
              <ReportCard
                report={item}
                onApprove={() =>
                  updateStatus.mutate({ id: item.id, status: "approved" })
                }
                onRemove={() =>
                  updateStatus.mutate({ id: item.id, status: "removed" })
                }
                onWarn={() =>
                  updateStatus.mutate({ id: item.id, status: "warned" })
                }
              />
            )}
            ListEmptyComponent={
              <EmptyState
                icon="shield-checkmark-outline"
                title="Мэдээлэл байхгүй"
                subtitle={
                  tab === "pending"
                    ? "Шинэ мэдээлэл ирээгүй байна"
                    : "Нийт мэдээлэл байхгүй"
                }
              />
            }
          />
        </>
      )}
    </View>
  );
}
