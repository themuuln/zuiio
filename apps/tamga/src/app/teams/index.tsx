import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth";
import { useTeams, type Team } from "@/hooks/useTeams";
import { useCreateTeam, useRespondInvitation } from "@/hooks/useTeamMutations";
import { usePendingInvitations, type TeamInvitation } from "@/hooks/useTeams";
import { LoadingState, EmptyState } from "@/components/states";

// ── Role label map ───────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  owner: "Эзэн",
  manager: "Менежер",
  vet: "Эмч",
  groom: "Боорцогч",
  viewer: "Үзэгч",
};

// ── Team Card ────────────────────────────────────────────────────

function TeamCard({ team }: { team: Team }) {
  const router = useRouter();

  return (
    <TouchableOpacity
      className="bg-card rounded-xl p-4 mb-3 border border-border"
      onPress={() => router.push(`/teams/${team.id}`)}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-lg font-bold text-foreground">{team.name}</Text>
          <View className="flex-row items-center mt-1 gap-3">
            <Text className="text-muted-foreground text-sm">
              🐴 {team.horse_count} морь
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} className="text-muted-foreground" />
      </View>
    </TouchableOpacity>
  );
}

// ── Invitation Card ──────────────────────────────────────────────

function InvitationCard({
  invitation,
  onRespond,
}: {
  invitation: TeamInvitation;
  onRespond: (id: string, teamId: string, status: "accepted" | "declined") => void;
}) {
  return (
    <View className="bg-card rounded-xl p-4 mb-3 border border-primary/30">
      <View className="flex-row items-center gap-2 mb-2">
        <Ionicons name="mail-open-outline" size={20} className="text-primary" />
        <Text className="text-sm font-semibold text-primary">Урилга</Text>
      </View>
      <Text className="text-foreground font-semibold mb-1">
        {invitation.team_name || "Баг"}
      </Text>
      <Text className="text-muted-foreground text-sm mb-3">
        Эрх: {ROLE_LABELS[invitation.role] ?? invitation.role}
      </Text>
      <View className="flex-row gap-2">
        <TouchableOpacity
          className="flex-1 bg-primary rounded-lg py-2 items-center"
          onPress={() => onRespond(invitation.id, invitation.team_id, "accepted")}
        >
          <Text className="text-primary-foreground font-semibold">Зөвшөөрөх</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 bg-secondary rounded-lg py-2 items-center"
          onPress={() => onRespond(invitation.id, invitation.team_id, "declined")}
        >
          <Text className="text-secondary-foreground font-semibold">Татгалзах</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Main Screen ──────────────────────────────────────────────────

export default function TeamListScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id;

  const { data: teams, isPending, refetch, isRefetching } = useTeams(userId);
  const { data: invitations } = usePendingInvitations(userId);
  const createTeam = useCreateTeam();
  const respondInvitation = useRespondInvitation();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");

  const teamList = teams ?? [];
  const pendingInvitations = invitations ?? [];

  async function handleCreateTeam() {
    const trimmed = newTeamName.trim();
    if (!trimmed) {
      Alert.alert("Алдаа", "Багийн нэр оруулна уу");
      return;
    }

    try {
      await createTeam.mutateAsync({ name: trimmed });
      setNewTeamName("");
      setShowCreateModal(false);
      Alert.alert("Амжилттай", `"${trimmed}" баг бүтээгдлээ`);
    } catch {
      Alert.alert("Алдаа", "Баг үүсгэхэд алдаа гарлаа");
    }
  }

  function handleRespondInvitation(
    id: string,
    teamId: string,
    status: "accepted" | "declined",
  ) {
    const label = status === "accepted" ? "зөвшөөрөх" : "татгалзах";
    Alert.alert("Баталгаажуулах", `Урилгыг ${label} уу?`, [
      { text: "Цуцлах", style: "cancel" },
      {
        text: status === "accepted" ? "Зөвшөөрөх" : "Татгалзах",
        style: status === "declined" ? "destructive" : "default",
        onPress: () => respondInvitation.mutate({ invitationId: id, teamId, status }),
      },
    ]);
  }

  const hasContent = teamList.length > 0 || pendingInvitations.length > 0;

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-12 pb-4">
        <Text className="text-2xl font-bold text-foreground">Багууд</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} className="text-muted-foreground" />
        </TouchableOpacity>
      </View>

      {isPending ? (
        <LoadingState text="Багууд ачаалж байна..." />
      ) : !hasContent ? (
        <EmptyState
          icon="people-outline"
          title="Баг байхгүй байна"
          subtitle="Шинэ баг үүсгэж эсвэл урилга хүлээн авна уу"
        />
      ) : (
        <FlatList
          data={teamList}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            pendingInvitations.length > 0 ? (
              <View className="px-4 mb-2">
                <Text className="text-sm font-semibold text-muted-foreground mb-2">
                  Хүлээгдэж буй урилга ({pendingInvitations.length})
                </Text>
                {pendingInvitations.map((inv) => (
                  <InvitationCard
                    key={inv.id}
                    invitation={inv}
                    onRespond={handleRespondInvitation}
                  />
                ))}
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <View className="px-4">
              <TeamCard team={item} />
            </View>
          )}
          contentContainerClassName="pb-24"
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
        />
      )}

      {/* FAB — Create Team */}
      <TouchableOpacity
        className="absolute bottom-6 right-6 bg-primary w-14 h-14 rounded-full items-center justify-center shadow-lg"
        onPress={() => setShowCreateModal(true)}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>

      {/* Create Team Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View className="flex-1 bg-background">
          <View className="flex-row items-center justify-between px-4 pt-12 pb-4">
            <Text className="text-xl font-bold text-foreground">
              Шинэ баг үүсгэх
            </Text>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Ionicons name="close" size={24} className="text-muted-foreground" />
            </TouchableOpacity>
          </View>

          <View className="px-4">
            <View className="bg-card rounded-2xl p-4 mb-4">
              <Text className="text-sm font-semibold text-muted-foreground mb-3">
                Багийн нэр
              </Text>
              <TextInput
                className="bg-secondary rounded-lg px-4 py-3 text-foreground"
                placeholder="Жишээ: Манай ажлын баг"
                placeholderTextColor="rgb(var(--muted-foreground))"
                value={newTeamName}
                onChangeText={setNewTeamName}
                autoFocus
              />
            </View>

            <TouchableOpacity
              className="bg-primary rounded-xl py-4 items-center"
              onPress={handleCreateTeam}
              disabled={createTeam.isPending || !newTeamName.trim()}
              style={{ opacity: createTeam.isPending || !newTeamName.trim() ? 0.5 : 1 }}
            >
              <Text className="text-primary-foreground font-bold text-lg">
                {createTeam.isPending ? "Үүсгэж байна..." : "Баг үүсгэх"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}