import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { InfoRow } from "@/components/ui/InfoRow";
import { Separator } from "@/components/ui/Separator";
import { Button } from "@/components/ui/Button";
import { LoadingState, ErrorState, EmptyState } from "@/components/states";
import { format } from "date-fns";

// ── Types ───────────────────────────────────────────────────────

interface Race {
  id: string;
  name: string;
  location: string;
  race_date: string;
  distance_km: number;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  description: string | null;
  prize_pool: number | null;
  max_entries: number | null;
  category: string | null;
  created_at: string;
}

interface RaceEntryRow {
  id: string;
  race_id: string;
  horse_id: string;
  position: number | null;
  finish_time: string | null;
  prize: number | null;
  status: "registered" | "started" | "finished" | "disqualified";
  horses: { name: string } | null;
  profiles: { display_name: string } | null;
}

// ── Constants ───────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  upcoming: "Удахгүй",
  ongoing: "Болж байна",
  completed: "Дууссан",
  cancelled: "Цуцалсан",
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "success" | "destructive" | "warning"> = {
  upcoming: "default",
  ongoing: "warning",
  completed: "success",
  cancelled: "destructive",
};

const ENTRY_STATUS: Record<string, string> = {
  registered: "Бүртгүүлсэн",
  started: "Эхэлсэн",
  finished: "Дууссан",
  disqualified: "Хасагдсан",
};

const ENTRY_STATUS_VARIANTS: Record<string, "default" | "secondary" | "success" | "destructive" | "warning"> = {
  registered: "default",
  started: "warning",
  finished: "success",
  disqualified: "destructive",
};

const POSITION_OPTIONS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];

// ── Editable Entry Row ──────────────────────────────────────────

function EditableEntryRow({
  entry,
  onPositionChange,
  onTimeChange,
}: {
  entry: RaceEntryRow;
  onPositionChange: (entryId: string, value: string) => void;
  onTimeChange: (entryId: string, value: string) => void;
}) {
  return (
    <Card className="mb-3">
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1 mr-3">
          <Text className="text-foreground font-semibold" numberOfLines={1}>
            {entry.horses?.name ?? "Морь мэдээлэл байхгүй"}
          </Text>
          <Text className="text-muted-foreground text-sm mt-0.5" numberOfLines={1}>
            {entry.profiles?.display_name ?? "Унаач мэдээлэл байхгүй"}
          </Text>
        </View>
        <Badge variant={ENTRY_STATUS_VARIANTS[entry.status] ?? "secondary"}>
          {ENTRY_STATUS[entry.status] ?? entry.status}
        </Badge>
      </View>

      <View className="flex-row gap-3">
        <View className="flex-1">
          <Text className="text-muted-foreground text-xs mb-1">Байр</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-1"
          >
            <View className="flex-row gap-1.5">
              {POSITION_OPTIONS.map((pos) => (
                <TouchableOpacity
                  key={pos}
                  onPress={() => onPositionChange(entry.id, pos)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: String(entry.position) === pos }}
                  accessibilityLabel={`${pos}-р байр`}
                  className={`rounded-lg px-3 py-1.5 border ${
                    String(entry.position) === pos
                      ? "bg-primary border-primary"
                      : "bg-card border-border"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      String(entry.position) === pos
                        ? "text-primary-foreground"
                        : "text-foreground"
                    }`}
                  >
                    {pos}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>

      <View className="mt-2">
        <Text className="text-muted-foreground text-xs mb-1">Цаг</Text>
        <TextInput
          className="bg-card border border-border rounded-xl px-4 py-2.5 text-foreground text-base"
          placeholder="00:00:00"
          placeholderTextColor="rgb(var(--muted-foreground))"
          value={entry.finish_time ?? ""}
          onChangeText={(v) => onTimeChange(entry.id, v)}
          keyboardType="default"
          autoCapitalize="none"
          accessibilityLabel={`Цаг - ${entry.horses?.name ?? "морь"}`}
        />
      </View>
    </Card>
  );
}

// ── Entry Row (read-only) ───────────────────────────────────────

function EntryRow({ entry }: { entry: RaceEntryRow }) {
  return (
    <View className="flex-row items-center gap-3 py-2.5 border-b border-border">
      <View className="flex-1">
        <Text className="text-foreground font-medium" numberOfLines={1}>
          {entry.horses?.name ?? "Морь мэдээлэл байхгүй"}
        </Text>
        <Text className="text-muted-foreground text-sm" numberOfLines={1}>
          {entry.profiles?.display_name ?? "Унаач мэдээлэл байхгүй"}
        </Text>
      </View>
      {entry.position != null && (
        <Text className="text-foreground font-medium mr-2">
          {entry.position}-р
        </Text>
      )}
      {entry.finish_time && (
        <Text className="text-muted-foreground text-sm mr-2">
          ⏱ {entry.finish_time}
        </Text>
      )}
      <Badge variant={ENTRY_STATUS_VARIANTS[entry.status] ?? "secondary"}>
        {ENTRY_STATUS[entry.status] ?? entry.status}
      </Badge>
    </View>
  );
}

// ── Main Screen ─────────────────────────────────────────────────

export default function RaceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [edits, setEdits] = useState<
    Record<string, { position: string; finish_time: string }>
  >({});

  // ── Fetch race ──
  const {
    data: race,
    isPending: racePending,
    error: raceError,
    refetch: refetchRace,
  } = useQuery<Race>({
    queryKey: ["race", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("races")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as Race;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });

  // ── Fetch entries ──
  const {
    data: entries = [],
    isPending: entriesPending,
    error: entriesError,
    refetch: refetchEntries,
  } = useQuery<RaceEntryRow[]>({
    queryKey: ["race-entries", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("race_entries")
        .select("*, horses(name), profiles(display_name)")
        .eq("race_id", id!);
      if (error) throw error;
      return data as RaceEntryRow[];
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });

  // ── Save results mutation ──
  const saveResults = useMutation({
    mutationFn: async () => {
      const updates = entries
        .filter((e) => edits[e.id])
        .map((e) => {
          const edit = edits[e.id];
          const patch: Record<string, unknown> = {};
          if (edit.position !== "") patch.position = Number(edit.position);
          if (edit.finish_time !== "") patch.finish_time = edit.finish_time;
          return supabase.from("race_entries").update(patch).eq("id", e.id);
        });
      await Promise.all(updates);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["race-entries", id] });
      setEdits({});
      Alert.alert("Амжилттай", "Үр дүн хадгалагдлаа");
    },
    onError: (err: Error) => {
      Alert.alert("Алдаа", err.message || "Үр дүн хадгалахад алдаа гарлаа");
    },
  });

  // ── Handlers ──
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchRace(), refetchEntries()]);
    setRefreshing(false);
  }, [refetchRace, refetchEntries]);

  function handlePositionChange(entryId: string, value: string) {
    setEdits((prev) => ({
      ...prev,
      [entryId]: {
        position: value,
        finish_time: prev[entryId]?.finish_time ?? entries.find((e) => e.id === entryId)?.finish_time ?? "",
      },
    }));
  }

  function handleTimeChange(entryId: string, value: string) {
    setEdits((prev) => ({
      ...prev,
      [entryId]: {
        position: prev[entryId]?.position ?? String(entries.find((e) => e.id === entryId)?.position ?? ""),
        finish_time: value,
      },
    }));
  }

  // ── Loading / Error ──
  if (racePending) return <LoadingState />;
  if (raceError || !race) return <ErrorState onRetry={() => refetchRace()} />;

  const isCompleted = race.status === "completed";
  const hasEdits = Object.keys(edits).length > 0;
  const formattedDate = format(new Date(race.race_date), "yyyy-MM-dd");

  // Merge edits into display entries
  const displayEntries = entries.map((e) => {
    const edit = edits[e.id];
    if (!edit) return e;
    return {
      ...e,
      position: edit.position !== "" ? Number(edit.position) : e.position,
      finish_time: edit.finish_time || e.finish_time,
    };
  });

  return (
    <View className="flex-1 bg-background">
      <PageHeader title="Уралдааны дэлгэрэнгүй" showBack />

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pb-12"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* ── Race Title & Status ── */}
        <View className="mb-4">
          <Text className="text-2xl font-bold text-foreground mb-2">
            {race.name}
          </Text>
          <Badge variant={STATUS_VARIANTS[race.status] ?? "secondary"}>
            {STATUS_LABELS[race.status] ?? race.status}
          </Badge>
        </View>

        {/* ── Race Details ── */}
        <Card className="mb-4">
          <InfoRow label="Огноо" value={formattedDate} />
          {race.location && <InfoRow label="Байршил" value={race.location} />}
          <InfoRow label="Зай" value={`${race.distance_km} км`} />
          {race.category && <InfoRow label="Ангилал" value={race.category} />}
          {race.prize_pool != null && race.prize_pool > 0 && (
            <InfoRow
              label="Шагналт"
              value={`${race.prize_pool.toLocaleString("mn-MN")}₮`}
            />
          )}
          {race.max_entries && (
            <InfoRow label="Дээд оролцогч" value={`${race.max_entries}`} />
          )}
        </Card>

        {/* ── Description ── */}
        {race.description ? (
          <Card className="mb-4">
            <Text className="text-muted-foreground text-sm mb-2">Тодорхойлолт</Text>
            <Text className="text-foreground leading-5">{race.description}</Text>
          </Card>
        ) : null}

        <Separator className="my-4" />

        {/* ── Participants / Results Editor ── */}
        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold text-foreground">
              {isCompleted ? "Үр дүн" : "Оролцогчид"}
            </Text>
            <Text className="text-muted-foreground text-sm">
              {entriesPending ? "..." : entries.length}
            </Text>
          </View>

          {entriesPending ? (
            <LoadingState text="Ачаалж байна..." />
          ) : entriesError ? (
            <ErrorState onRetry={() => refetchEntries()} />
          ) : entries.length === 0 ? (
            <EmptyState
              icon="people-outline"
              title="Оролцогч байхгүй"
              subtitle="Энэ уралдаанд оролцогч бүртгүүлээгүй байна"
            />
          ) : isCompleted ? (
            // ── Results editor ──
            <View>
              {displayEntries.map((entry) => (
                <EditableEntryRow
                  key={entry.id}
                  entry={entry}
                  onPositionChange={handlePositionChange}
                  onTimeChange={handleTimeChange}
                />
              ))}

              {hasEdits && (
                <Button
                  title="Үр дүн хадгалах"
                  loading={saveResults.isPending}
                  onPress={() => saveResults.mutate()}
                  className="mt-3"
                />
              )}
            </View>
          ) : (
            // ── Read-only entry list ──
            <Card>
              {entries.map((entry) => (
                <EntryRow key={entry.id} entry={entry} />
              ))}
            </Card>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
