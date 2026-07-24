import { View, Text, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Loading } from "@/components/ui/Loading";
import { ErrorState } from "@/components/states";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";

/* ── Types ─────────────────────────────────────────────────────── */

interface PublicHorse {
  id: string;
  name: string;
  gender: "stallion" | "mare" | "gelding";
  coat: string;
  birth_year: number;
  breed: string | null;
  registration_no: string | null;
  microchip_id: string | null;
  owner_id: string;
  created_at: string;
  profiles: { display_name: string | null } | null;
  pedigree_links: PedigreeEntry[];
}

interface PedigreeEntry {
  id: string;
  horse_id: string;
  parent_id: string;
  relation: "sire" | "dam";
  parent: { name: string; id: string } | null;
}

/* ── Constants ─────────────────────────────────────────────────── */

const GENDER_LABEL: Record<string, string> = {
  stallion: "Эр",
  mare: "Эм",
  gelding: "Тайвсан",
};

const LOG_TYPE_LABELS: Record<string, string> = {
  vaccination: "Вакцин",
  treatment: "Эмчилгээ",
  farrier: "Мөр",
  deworming: "Бөөлжүүр",
  dental: "Шүд",
  checkup: "Шалгалт",
  other: "Бусад",
};

/* ── Query ─────────────────────────────────────────────────────── */

function usePublicHorse(id: string | undefined) {
  return useQuery({
    queryKey: ["public-horse", id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("horses")
        .select(
          "*, profiles(display_name), pedigree_links(*, parent:horses!pedigree_links_parent_id_fkey(name, id))"
        )
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as PublicHorse;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

function usePublicHealthLogs(horseId: string | undefined) {
  return useQuery({
    queryKey: ["public-health-logs", horseId],
    queryFn: async () => {
      if (!horseId) return [];

      const { data, error } = await supabase
        .from("health_logs")
        .select("*")
        .eq("horse_id", horseId)
        .order("date", { ascending: false })
        .limit(3);

      if (error) throw error;
      return data as {
        id: string;
        log_type: string;
        date: string;
        notes: string | null;
        medicament: string | null;
        cost: number | null;
      }[];
    },
    enabled: !!horseId,
    staleTime: 1000 * 60 * 5,
  });
}

function usePublicCertificateCount(horseId: string | undefined) {
  return useQuery({
    queryKey: ["public-cert-count", horseId],
    queryFn: async () => {
      if (!horseId) return 0;

      const { count, error } = await supabase
        .from("digital_certificates")
        .select("id", { count: "exact", head: true })
        .eq("horse_id", horseId);

      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!horseId,
    staleTime: 1000 * 60 * 5,
  });
}

/* ── Sub-components ────────────────────────────────────────────── */

function HealthLogRow({
  log,
}: {
  log: { log_type: string; date: string; notes: string | null; medicament: string | null };
}) {
  return (
    <View className="bg-secondary/50 rounded-lg px-3 py-2 mb-2">
      <View className="flex-row justify-between items-center mb-1">
        <Badge variant="secondary">{LOG_TYPE_LABELS[log.log_type] ?? log.log_type}</Badge>
        <Text className="text-muted-foreground text-xs">
          {format(new Date(log.date), "yyyy-MM-dd")}
        </Text>
      </View>
      {log.notes && (
        <Text className="text-foreground text-sm" numberOfLines={2}>
          {log.notes}
        </Text>
      )}
      {log.medicament && (
        <Text className="text-muted-foreground text-xs mt-1">💊 {log.medicament}</Text>
      )}
    </View>
  );
}

/* ── Screen ────────────────────────────────────────────────────── */

export default function PublicHorseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { data: horse, isPending, error } = usePublicHorse(id);
  const { data: healthLogs = [] } = usePublicHealthLogs(id);
  const { data: certCount = 0 } = usePublicCertificateCount(id);

  if (isPending) return <Loading />;
  if (error || !horse) return <ErrorState message="Морь олдсонгүй" onRetry={() => router.back()} />;

  const age = new Date().getFullYear() - horse.birth_year;
  const sire = horse.pedigree_links.find((p) => p.relation === "sire")?.parent;
  const dam = horse.pedigree_links.find((p) => p.relation === "dam")?.parent;

  return (
    <View className="flex-1 bg-background">
      <PageHeader title="Нийтийн профиль" showBack />

      <ScrollView className="flex-1 px-4">
        {/* ── Hero ──────────────────────────────────────────── */}
        <Card className="mb-4 items-center">
          <Avatar name={horse.name} size="lg" />
          <Text className="text-2xl font-bold text-foreground mt-3">{horse.name}</Text>
          {horse.registration_no && (
            <Text className="text-muted-foreground text-sm">{horse.registration_no}</Text>
          )}
          <View className="flex-row flex-wrap gap-2 mt-3 justify-center">
            {horse.breed && (
              <Badge variant="outline">{horse.breed}</Badge>
            )}
            <Badge variant="secondary">{GENDER_LABEL[horse.gender] ?? horse.gender}</Badge>
            <Badge variant="secondary">{horse.coat}</Badge>
            <Badge variant="secondary">{age} нас</Badge>
          </View>
        </Card>

        {/* ── Owner ─────────────────────────────────────────── */}
        <Card className="mb-4">
          <View className="flex-row items-center gap-2 mb-1">
            <Ionicons name="person-outline" size={18} className="text-muted-foreground" />
            <Text className="text-sm font-semibold text-foreground">Эзэмшигч</Text>
          </View>
          <Text className="text-muted-foreground ml-6">
            {horse.profiles?.display_name ?? "Нэр мэдээлэл хуваалцаагүй"}
          </Text>
        </Card>

        {/* ── Lineage ───────────────────────────────────────── */}
        <Card className="mb-4">
          <View className="flex-row items-center gap-2 mb-3">
            <Ionicons name="git-network-outline" size={18} className="text-muted-foreground" />
            <Text className="text-sm font-semibold text-foreground">Угсаа гарвал</Text>
          </View>
          <View className="flex-row gap-3">
            <View className="flex-1 bg-secondary/50 rounded-lg p-3">
              <Text className="text-muted-foreground text-xs mb-1">Эцэг</Text>
              {sire ? (
                <Text className="text-foreground font-medium">{sire.name}</Text>
              ) : (
                <Text className="text-muted-foreground text-sm">Мэдээлэл байхгүй</Text>
              )}
            </View>
            <View className="flex-1 bg-secondary/50 rounded-lg p-3">
              <Text className="text-muted-foreground text-xs mb-1">Эх</Text>
              {dam ? (
                <Text className="text-foreground font-medium">{dam.name}</Text>
              ) : (
                <Text className="text-muted-foreground text-sm">Мэдээлэл байхгүй</Text>
              )}
            </View>
          </View>
        </Card>

        {/* ── Certificates ──────────────────────────────────── */}
        <Card className="mb-4 flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Ionicons name="document-text-outline" size={18} className="text-muted-foreground" />
            <Text className="text-sm font-semibold text-foreground">Гэрчилгээ</Text>
          </View>
          <Badge variant={certCount > 0 ? "default" : "secondary"}>{certCount} ширхэг</Badge>
        </Card>

        {/* ── Recent health logs ────────────────────────────── */}
        <Card className="mb-8">
          <View className="flex-row items-center gap-2 mb-3">
            <Ionicons name="medkit-outline" size={18} className="text-muted-foreground" />
            <Text className="text-sm font-semibold text-foreground">Сүүлийн эрүүл мэнд</Text>
          </View>
          {healthLogs.length === 0 ? (
            <Text className="text-muted-foreground text-sm">Эрүүл мэндийн мэдээлэл байхгүй</Text>
          ) : (
            healthLogs.map((log) => <HealthLogRow key={log.id} log={log} />)
          )}
        </Card>
      </ScrollView>
    </View>
  );
}
