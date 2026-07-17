import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth";
import { useTeam, useTeamMembers } from "@/hooks/useTeams";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingState, ErrorState } from "@/components/states";

// ── Role labels ──────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  owner: "Эзэн",
  manager: "Менежер",
  vet: "Эмч",
  groom: "Боорцогч",
  viewer: "Үзэгч",
};

// ── Info Row ─────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between items-center py-3 border-b border-border">
      <Text className="text-muted-foreground text-sm">{label}</Text>
      <Text className="text-foreground font-medium">{value}</Text>
    </View>
  );
}

// ── Main Screen ──────────────────────────────────────────────────

export default function TeamProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id;

  const {
    data: team,
    isPending: teamLoading,
    error: teamError,
    refetch: refetchTeam,
  } = useTeam(id);

  const {
    data: members,
    isPending: membersLoading,
  } = useTeamMembers(id);

  const isOwner = team?.owner_user_id === userId;
  const isManager =
    members?.some((m) => m.user_id === userId && m.role === "manager") ?? false;
  const canEdit = isOwner || isManager;
  const memberCount = members?.length ?? 0;

  if (teamLoading || membersLoading) return <LoadingState text="Багийн мэдээлэл ачаалж байна..." />;
  if (teamError || !team) return <ErrorState onRetry={() => refetchTeam()} />;

  const createdDate = new Date(team.created_at).toLocaleDateString("mn-MN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <View className="flex-1 bg-background">
      <PageHeader
        title="Багийн мэдээлэл"
        showBack
        rightAction={
          canEdit ? (
            <TouchableOpacity
              onPress={() => {
                Alert.alert("Засварлах", "Удахгүй засварлах боломж нэмэгдэнэ");
              }}
            >
              <Ionicons name="create-outline" size={24} className="text-primary" />
            </TouchableOpacity>
          ) : undefined
        }
      />

      <ScrollView
        className="flex-1 px-4"
        contentContainerClassName="pb-8"
      >
        {/* Team Name & Description */}
        <View className="bg-card rounded-xl p-5 mb-4">
          <View className="flex-row items-center gap-3 mb-3">
            <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center">
              <Ionicons name="people" size={24} className="text-primary" />
            </View>
            <View className="flex-1">
              <Text className="text-foreground font-bold text-lg">{team.name}</Text>
              {isOwner && (
                <Text className="text-primary text-xs font-medium">Эзэн</Text>
              )}
            </View>
          </View>
        </View>

        {/* Details */}
        <View className="bg-card rounded-xl p-4 mb-4">
          <Text className="text-foreground font-semibold mb-2">Дэлгэрэнгүй</Text>
          <InfoRow label="Багийн нэр" value={team.name} />
          <InfoRow label="Гишүүдийн тоо" value={`${memberCount} гишүүн`} />
          <InfoRow label="Морьны тоо" value={`${team.horse_count ?? 0} морь`} />
          <InfoRow label="Үүсгэсэн огноо" value={createdDate} />
        </View>

        {/* Owner Info */}
        <View className="bg-card rounded-xl p-4">
          <Text className="text-foreground font-semibold mb-2">Эзэмшигч</Text>
          {members?.filter((m) => m.role === "owner").map((member) => (
            <View
              key={member.id}
              className="flex-row items-center py-3 border-b border-border"
            >
              <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-3">
                <Text className="text-primary font-bold text-sm">
                  {member.profiles?.name?.[0] ?? "?"}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-foreground font-medium">
                  {member.profiles?.name ?? "Тодорхойгүй"}
                </Text>
                <Text className="text-muted-foreground text-sm">
                  {ROLE_LABELS[member.role] ?? member.role}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
