import { View, Text, ScrollView, Pressable } from "react-native";
import { useAuthStore } from "@/src/config/stores";
import { PreviewGymRepository } from "@/src/data/preview-repository";
import { useQuery } from "@tanstack/react-query";
import { router, Redirect } from "expo-router";

const repo = new PreviewGymRepository();

export default function HomeScreen() {
  const user = useAuthStore((s) => s.currentUser);
  const signOut = useAuthStore((s) => s.signOut);

  const { data: dashboard, isPending } = useQuery({
    queryKey: ["dashboard", user?.id],
    queryFn: () => repo.fetchMemberDashboard(user!.id),
    enabled: !!user,
  });

  if (!user) {
    return <Redirect href="/(auth)/role-select" />;
  }

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="px-6 pt-6 pb-4">
        <Text className="text-2xl font-bold text-foreground">
          Сайн байна уу, {user.name}
        </Text>
        <Text className="text-muted-foreground mt-1">{user.role}</Text>
      </View>

      {isPending ? (
        <View className="px-6 py-10">
          <Text className="text-muted-foreground">Ачаалж байна...</Text>
        </View>
      ) : dashboard ? (
        <View className="px-6 gap-4">
          {/* Stats Grid */}
          <View className="flex-row gap-3">
            <StatCard
              label="Дасгал"
              value={`${dashboard.totalWorkouts}`}
              sublabel="нийт"
            />
            <StatCard
              label="Streak"
              value={`${dashboard.workoutStreak}`}
              sublabel="өдөр"
            />
          </View>

          {/* Membership Status */}
          <View className="rounded-xl border border-border bg-card p-4">
            <Text className="text-sm font-medium text-muted-foreground">
              Гишүүнчлэл
            </Text>
            <Text className="text-lg font-semibold text-card-foreground mt-1">
              {dashboard.member.membershipPlanName ?? "Томилогдоогүй"}
            </Text>
            {dashboard.member.membershipEndDate && (
              <Text className="text-sm text-muted-foreground mt-1">
                Хүчинтэй хугацаа: {dashboard.member.membershipEndDate}
              </Text>
            )}
            <View className="mt-2 flex-row items-center gap-2">
              <View
                className={`h-2 w-2 rounded-full ${
                  dashboard.member.status === "active"
                    ? "bg-green-500"
                    : dashboard.member.status === "frozen"
                      ? "bg-yellow-500"
                      : "bg-red-500"
                }`}
              />
              <Text className="text-sm text-card-foreground capitalize">
                {dashboard.member.status}
              </Text>
            </View>
          </View>

          {/* Latest PR */}
          {dashboard.latestPR && (
            <View className="rounded-xl border border-border bg-card p-4">
              <Text className="text-sm font-medium text-muted-foreground">
                Сүүлийн PR
              </Text>
              <Text className="text-lg font-semibold text-card-foreground mt-1">
                {dashboard.latestPR.exerciseName} — {dashboard.latestPR.weight}
                kg × {dashboard.latestPR.reps}
              </Text>
              <Text className="text-sm text-muted-foreground mt-1">
                {dashboard.latestPR.date}
              </Text>
            </View>
          )}

          {/* Quick Actions */}
          <View className="gap-3 mt-2">
            <Text className="text-sm font-medium text-muted-foreground">
              Хурдан үйлдэл
            </Text>
            <Pressable
              onPress={() => router.push("/(tabs)/workouts")}
              className="rounded-xl bg-primary p-4 active:opacity-80"
            >
              <Text className="text-primary-foreground font-semibold text-center">
                Дасгал эхлэх
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {/* Sign Out */}
      <View className="px-6 py-8">
        <Pressable
          onPress={() => {
            signOut();
            router.replace("/(auth)/role-select");
          }}
          className="rounded-xl border border-border p-4 active:opacity-70"
        >
          <Text className="text-destructive text-center font-medium">
            Гарах
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function StatCard({
  label,
  value,
  sublabel,
}: {
  label: string;
  value: string;
  sublabel: string;
}) {
  return (
    <View className="flex-1 rounded-xl border border-border bg-card p-4">
      <Text className="text-sm font-medium text-muted-foreground">{label}</Text>
      <Text className="text-3xl font-bold text-card-foreground mt-1">
        {value}
      </Text>
      <Text className="text-xs text-muted-foreground">{sublabel}</Text>
    </View>
  );
}
