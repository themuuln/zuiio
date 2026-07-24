import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth";
import {
  useTeam,
  useTeamMembers,
  useTeamHorses,
  useTeamActivity,
  type TeamMemberWithProfile,
  type TeamRole,
} from "@/hooks/useTeams";
import { useRemoveTeamMember } from "@/hooks/useTeamMutations";
import { LoadingState, ErrorState, EmptyState } from "@/components/states";

// ── Constants ────────────────────────────────────────────────────

const ROLE_LABELS: Record<TeamRole, string> = {
  owner: "Эзэн",
  manager: "Менежер",
  vet: "Эмч",
  groom: "Боорцогч",
  viewer: "Үзэгч",
};

const ROLE_COLORS: Record<TeamRole, string> = {
  owner: "bg-primary/15 text-primary",
  manager: "bg-blue-500/15 text-blue-500",
  vet: "bg-green-500/15 text-green-500",
  groom: "bg-amber-500/15 text-amber-500",
  viewer: "bg-secondary text-muted-foreground",
};

const ACTION_LABELS: Record<string, string> = {
  team_created: "Баг үүсгэсэн",
  member_invited: "Гишүүн уригласан",
  member_joined: "Гишүүн нэгдсэн",
  member_removed: "Гишүүн хасагдсан",
  horse_added: "Морь нэмсэн",
  horse_removed: "Морь хассан",
  role_changed: "Эрх өөрчилсөн",
};

type DetailTab = "members" | "horses" | "activity";

// ── Helpers ──────────────────────────────────────────────────────

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Одоо";
  if (mins < 60) return `${mins} мин`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} цаг`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} өдөр`;
  const months = Math.floor(days / 30);
  return `${months} сар`;
}

// ── Member Row ───────────────────────────────────────────────────

function MemberRow({
  member,
  isOwner,
  currentUserId,
  onRemove,
}: {
  member: TeamMemberWithProfile;
  isOwner: boolean;
  currentUserId: string;
  onRemove: (memberId: string) => void;
}) {
  const profileName = member.profiles?.name ?? "Тодорхойгүй";
  const roleClass = ROLE_COLORS[member.role] ?? "bg-secondary text-muted-foreground";
  const canRemove = isOwner && member.user_id !== currentUserId && member.role !== "owner";

  return (
    <View className="flex-row items-center py-3 border-b border-border">
      {/* Avatar */}
      <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-3">
        <Text className="text-sm font-bold text-primary">
          {getInitials(profileName)}
        </Text>
      </View>

      {/* Name + phone */}
      <View className="flex-1">
        <Text className="text-foreground font-medium">{profileName}</Text>
        {member.profiles?.phone && (
          <Text className="text-muted-foreground text-xs">{member.profiles.phone}</Text>
        )}
      </View>

      {/* Role badge */}
      <View className={`rounded-lg px-2 py-1 mr-2 ${roleClass.split(" ")[0]}`}>
        <Text className={`text-xs font-medium ${roleClass.split(" ")[1]}`}>
          {ROLE_LABELS[member.role]}
        </Text>
      </View>

      {/* Remove button */}
      {canRemove && (
        <TouchableOpacity onPress={() => onRemove(member.user_id)}>
          <Ionicons name="close-circle" size={22} className="text-destructive" />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Horse Row ────────────────────────────────────────────────────

function HorseRow({ name, gender, coat }: { name: string; gender: string; coat: string }) {
  const genderLabel =
    gender === "stallion" || gender === "male"
      ? "Эр"
      : gender === "mare" || gender === "female"
        ? "Эм"
        : "Буурал";

  return (
    <View className="flex-row items-center py-3 border-b border-border">
      <View className="w-10 h-10 rounded-full bg-secondary items-center justify-center mr-3">
        <Text className="text-lg">🐴</Text>
      </View>
      <View className="flex-1">
        <Text className="text-foreground font-medium">{name}</Text>
        <Text className="text-muted-foreground text-sm">
          {genderLabel} · {coat}
        </Text>
      </View>
    </View>
  );
}

// ── Activity Row ─────────────────────────────────────────────────

function ActivityRow({ action, details, createdAt }: {
  action: string;
  details: Record<string, unknown>;
  createdAt: string;
}) {
  const label = ACTION_LABELS[action] ?? action;
  const detailText =
    typeof details.team_name === "string"
      ? details.team_name
      : typeof details.role === "string"
        ? ROLE_LABELS[details.role as TeamRole] ?? details.role
        : null;

  return (
    <View className="flex-row py-3 border-b border-border">
      <View className="w-2 h-2 rounded-full bg-primary mt-2 mr-3" />
      <View className="flex-1">
        <Text className="text-foreground font-medium">{label}</Text>
        {detailText && (
          <Text className="text-muted-foreground text-sm">{detailText}</Text>
        )}
        <Text className="text-muted-foreground text-xs mt-1">
          {formatRelativeTime(createdAt)}
        </Text>
      </View>
    </View>
  );
}

// ── Main Screen ──────────────────────────────────────────────────

export default function TeamDetailScreen() {
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
    refetch: refetchMembers,
    isRefetching: membersRefreshing,
  } = useTeamMembers(id);

  const {
    data: horses,
    isPending: horsesLoading,
    refetch: refetchHorses,
    isRefetching: horsesRefreshing,
  } = useTeamHorses(id);

  const {
    data: activity,
    isPending: activityLoading,
    refetch: refetchActivity,
    isRefetching: activityRefreshing,
  } = useTeamActivity(id);

  const removeMember = useRemoveTeamMember();

  const [activeTab, setActiveTab] = useState<DetailTab>("members");

  const isOwner = team?.owner_user_id === userId;
  const isManager =
    members?.some((m) => m.user_id === userId && m.role === "manager") ?? false;
  const canInvite = isOwner || isManager;
  const memberCount = members?.length ?? 0;
  const horseCount = horses?.length ?? 0;

  function handleRemoveMember(memberUserId: string) {
    Alert.alert("Гишүүн хасах", "Энэ гишүүнийг багаас хасах уу?", [
      { text: "Цуцлах", style: "cancel" },
      {
        text: "Хасах",
        style: "destructive",
        onPress: () => {
          if (!id || !userId) return;
          const member = members?.find((m) => m.user_id === memberUserId);
          if (!member) return;
          removeMember.mutate({
            teamId: id,
            memberId: member.id,
            userId,
          });
        },
      },
    ]);
  }

  const currentRefreshing =
    activeTab === "members"
      ? membersRefreshing
      : activeTab === "horses"
        ? horsesRefreshing
        : activityRefreshing;

  const currentRefetch =
    activeTab === "members"
      ? refetchMembers
      : activeTab === "horses"
        ? refetchHorses
        : refetchActivity;

  if (teamLoading) return <LoadingState />;
  if (teamError || !team) return <ErrorState onRetry={() => refetchTeam()} />;

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-12 pb-4">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} className="text-foreground" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-foreground flex-1 text-center" numberOfLines={1}>
          {team.name}
        </Text>
        {canInvite && (
          <TouchableOpacity onPress={() => router.push({ pathname: "/teams/invite", params: { teamId: id } })}>
            <Ionicons name="person-add-outline" size={24} className="text-primary" />
          </TouchableOpacity>
        )}
      </View>

      {/* Stats Bar */}
      <View className="flex-row px-4 mb-4 gap-3">
        <View className="flex-1 bg-card rounded-xl p-3 items-center border border-border">
          <Text className="text-xl font-bold text-foreground">{memberCount}</Text>
          <Text className="text-muted-foreground text-xs">Гишүүн</Text>
        </View>
        <View className="flex-1 bg-card rounded-xl p-3 items-center border border-border">
          <Text className="text-xl font-bold text-foreground">{horseCount}</Text>
          <Text className="text-muted-foreground text-xs">Морь</Text>
        </View>
      </View>

      {/* Tab Bar */}
      <View className="flex-row bg-card mx-4 rounded-xl p-1 mb-4">
        {([
          ["members", "Гишүүд"],
          ["horses", "Морь"],
          ["activity", "Үйлдэл"],
        ] as const).map(([key, label]) => (
          <TouchableOpacity
            key={key}
            className={`flex-1 py-2 rounded-lg ${
              activeTab === key ? "bg-primary" : ""
            }`}
            onPress={() => setActiveTab(key)}
          >
            <Text
              className={`text-center font-medium ${
                activeTab === key
                  ? "text-primary-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <ScrollView
        className="flex-1 px-4"
        contentContainerClassName="pb-8"
        refreshControl={
          <RefreshControl refreshing={currentRefreshing} onRefresh={currentRefetch} />
        }
      >
        {/* Members Tab */}
        {activeTab === "members" && (
          <>
            {membersLoading ? (
              <LoadingState text="Гишүүд ачаалж байна..." />
            ) : !members || members.length === 0 ? (
              <EmptyState
                icon="people-outline"
                title="Гишүүн байхгүй байна"
              />
            ) : (
              <View className="bg-card rounded-xl p-4">
                {members.map((member) => (
                  <MemberRow
                    key={member.id}
                    member={member}
                    isOwner={isOwner}
                    currentUserId={userId ?? ""}
                    onRemove={handleRemoveMember}
                  />
                ))}
              </View>
            )}
          </>
        )}

        {/* Horses Tab */}
        {activeTab === "horses" && (
          <>
            {horsesLoading ? (
              <LoadingState text="Морь ачаалж байна..." />
            ) : !horses || horses.length === 0 ? (
              <EmptyState
                icon="paw-outline"
                title="Морь байхгүй байна"
                subtitle="Багт морь нэмнэ үү"
              />
            ) : (
              <View className="bg-card rounded-xl p-4">
                {horses.map((th) => (
                  <HorseRow
                    key={th.id}
                    name={th.horses?.name ?? "Тодорхойгүй"}
                    gender={th.horses?.gender ?? "stallion"}
                    coat={th.horses?.coat ?? ""}
                  />
                ))}
              </View>
            )}
          </>
        )}

        {/* Activity Tab */}
        {activeTab === "activity" && (
          <>
            {activityLoading ? (
              <LoadingState text="Үйлдэл ачаалж байна..." />
            ) : !activity || activity.length === 0 ? (
              <EmptyState
                icon="time-outline"
                title="Үйлдэл байхгүй байна"
              />
            ) : (
              <View className="bg-card rounded-xl p-4">
                {activity.map((log) => (
                  <ActivityRow
                    key={log.id}
                    action={log.action}
                    details={log.details}
                    createdAt={log.created_at}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}