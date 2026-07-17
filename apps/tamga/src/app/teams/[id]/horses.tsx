import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth";
import { useTeam, useTeamMembers, useTeamHorses, type TeamHorse } from "@/hooks/useTeams";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingState, ErrorState, EmptyState } from "@/components/states";

// ── Gender label ─────────────────────────────────────────────────

function genderLabel(gender: string): string {
  switch (gender) {
    case "stallion":
    case "male":
      return "Эр";
    case "mare":
    case "female":
      return "Эм";
    default:
      return "Буурал";
  }
}

// ── Horse Row ────────────────────────────────────────────────────

function HorseRow({ horse }: { horse: TeamHorse }) {
  const name = horse.horses?.name ?? "Тодорхойгүй";
  const gender = horse.horses?.gender ?? "stallion";
  const coat = horse.horses?.coat ?? "";

  return (
    <View className="flex-row items-center py-3 border-b border-border">
      <View className="w-10 h-10 rounded-full bg-secondary items-center justify-center mr-3">
        <Text className="text-lg">🐴</Text>
      </View>
      <View className="flex-1">
        <Text className="text-foreground font-medium">{name}</Text>
        <Text className="text-muted-foreground text-sm">
          {genderLabel(gender)} · {coat}
        </Text>
      </View>
      <Text className="text-muted-foreground text-xs">
        {new Date(horse.added_at).toLocaleDateString("mn-MN")}
      </Text>
    </View>
  );
}

// ── Main Screen ──────────────────────────────────────────────────

export default function TeamHorsesScreen() {
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

  const { data: members } = useTeamMembers(id);

  const {
    data: horses,
    isPending: horsesLoading,
    error: horsesError,
    refetch: refetchHorses,
    isRefetching,
  } = useTeamHorses(id);

  const horseList = horses ?? [];

  const isOwner = team?.owner_user_id === userId;
  const isManager =
    members?.some((m) => m.user_id === userId && m.role === "manager") ?? false;
  const canAddHorse = isOwner || isManager;

  if (teamLoading || horsesLoading) return <LoadingState text="Морьнууд ачаалж байна..." />;
  if (teamError || horsesError) {
    return <ErrorState onRetry={() => { refetchTeam(); refetchHorses(); }} />;
  }

  return (
    <View className="flex-1 bg-background">
      <PageHeader
        title="Багийн морьнууд"
        subtitle={horseList.length > 0 ? `${horseList.length} морь` : undefined}
        showBack
        rightAction={
          canAddHorse ? (
            <TouchableOpacity
              onPress={() => {
                Alert.alert("Морь нэмэх", "Удахгүй нэмэлт хийгдэнэ");
              }}
            >
              <Ionicons name="add-circle-outline" size={28} className="text-primary" />
            </TouchableOpacity>
          ) : undefined
        }
      />

      {horseList.length === 0 ? (
        <EmptyState
          icon="paw-outline"
          title="Морь байхгүй байна"
          subtitle={canAddHorse ? "Багт морь нэмнэ үү" : "Багт морь нэмэхгүй байна"}
        />
      ) : (
        <ScrollView
          className="flex-1 px-4"
          contentContainerClassName="pb-8"
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetchHorses} />
          }
        >
          <View className="bg-card rounded-xl p-4">
            {horseList.map((th) => (
              <HorseRow key={th.id} horse={th} />
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
