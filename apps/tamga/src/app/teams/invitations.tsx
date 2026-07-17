import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth";
import { usePendingInvitations, type TeamInvitation } from "@/hooks/useTeams";
import { useRespondInvitation } from "@/hooks/useTeamMutations";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingState, ErrorState, EmptyState } from "@/components/states";

// ── Role labels ──────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  owner: "Эзэн",
  manager: "Менежер",
  vet: "Эмч",
  groom: "Боорцогч",
  viewer: "Үзэгч",
};

// ── Format relative time ─────────────────────────────────────────

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Одоо";
  if (minutes < 60) return `${minutes} мин`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} цаг`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} өдөр`;
  return new Date(dateStr).toLocaleDateString("mn-MN");
}

// ── Invitation Card ──────────────────────────────────────────────

function InvitationCard({
  invitation,
  onRespond,
  responding,
}: {
  invitation: TeamInvitation;
  onRespond: (id: string, teamId: string, status: "accepted" | "declined") => void;
  responding: boolean;
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
      <Text className="text-muted-foreground text-sm mb-1">
        Эрх: {ROLE_LABELS[invitation.role] ?? invitation.role}
      </Text>
      <Text className="text-muted-foreground text-xs mb-3">
        {formatRelativeTime(invitation.created_at)} өмнө
      </Text>
      <View className="flex-row gap-2">
        <TouchableOpacity
          className="flex-1 bg-primary rounded-lg py-3 items-center"
          onPress={() => onRespond(invitation.id, invitation.team_id, "accepted")}
          disabled={responding}
          style={{ opacity: responding ? 0.5 : 1 }}
        >
          <Text className="text-primary-foreground font-semibold">Хүлээх</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 bg-secondary rounded-lg py-3 items-center"
          onPress={() => onRespond(invitation.id, invitation.team_id, "declined")}
          disabled={responding}
          style={{ opacity: responding ? 0.5 : 1 }}
        >
          <Text className="text-secondary-foreground font-semibold">Татгалзах</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Main Screen ──────────────────────────────────────────────────

export default function InvitationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id;

  const {
    data: invitations,
    isPending,
    error,
    refetch,
    isRefetching,
  } = usePendingInvitations(userId);
  const respondInvitation = useRespondInvitation();

  const pendingList = invitations ?? [];

  function handleRespond(
    invitationId: string,
    teamId: string,
    status: "accepted" | "declined",
  ) {
    const label = status === "accepted" ? "хүлээх" : "татгалзах";
    Alert.alert("Баталгаажуулах", `Урилгыг ${label} уу?`, [
      { text: "Цуцлах", style: "cancel" },
      {
        text: status === "accepted" ? "Хүлээх" : "Татгалзах",
        style: status === "declined" ? "destructive" : "default",
        onPress: () =>
          respondInvitation.mutate({ invitationId, teamId, status }),
      },
    ]);
  }

  if (isPending) return <LoadingState text="Урилгууд ачаалж байна..." />;
  if (error) return <ErrorState onRetry={() => refetch()} />;

  return (
    <View className="flex-1 bg-background">
      <PageHeader
        title="Урилгууд"
        subtitle={pendingList.length > 0 ? `${pendingList.length} хүлээгдэж буй` : undefined}
        showBack
      />

      {pendingList.length === 0 ? (
        <EmptyState
          icon="mail-outline"
          title="Урилга байхгүй байна"
          subtitle="Танай багт урилга ирэхэд энд харагдана"
        />
      ) : (
        <FlatList
          data={pendingList}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View className="px-4">
              <InvitationCard
                invitation={item}
                onRespond={handleRespond}
                responding={respondInvitation.isPending}
              />
            </View>
          )}
          contentContainerClassName="pb-24"
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
        />
      )}
    </View>
  );
}
