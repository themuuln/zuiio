import { View, Text, ScrollView, Pressable } from "react-native";
import { useAuthStore } from "@/src/config/stores";
import { PreviewGymRepository } from "@/src/data/preview-repository";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import QRCode from "react-native-qrcode-svg";

const repo = new PreviewGymRepository();

export default function ProfileScreen() {
  const user = useAuthStore((s) => s.currentUser);
  const signOut = useAuthStore((s) => s.signOut);

  const { data: dashboard, isPending } = useQuery({
    queryKey: ["dashboard", user?.id],
    queryFn: () => repo.fetchMemberDashboard(user!.id),
    enabled: !!user,
  });

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="px-6 pt-6 pb-4 items-center">
        {/* Avatar */}
        <View className="h-20 w-20 rounded-full bg-primary/10 items-center justify-center mb-3">
          <Text className="text-2xl font-bold text-primary">
            {user?.name?.charAt(0) ?? "?"}
          </Text>
        </View>

        <Text className="text-xl font-bold text-foreground">{user?.name}</Text>
        <Text className="text-muted-foreground mt-1">{user?.phone}</Text>
        <View className="mt-2 flex-row items-center gap-2">
          <View
            className={`h-2 w-2 rounded-full ${
              dashboard?.member.status === "active"
                ? "bg-green-500"
                : "bg-yellow-500"
            }`}
          />
          <Text className="text-sm text-muted-foreground capitalize">
            {dashboard?.member.status ?? "unknown"}
          </Text>
        </View>
      </View>

      {/* QR Code */}
      <View className="px-6 mb-6 items-center">
        <View className="rounded-xl border border-border bg-card p-6 items-center">
          <Text className="text-sm font-medium text-muted-foreground mb-3">
            Гишүүний QR код
          </Text>
          <QRCode
            value={`tumurch://member/${user?.id}`}
            size={160}
            color="#1a1a2e"
            backgroundColor="#ffffff"
          />
          <Text className="text-xs text-muted-foreground mt-3">
            Утсаа QR уншуулж нэвтрэнэ үү
          </Text>
        </View>
      </View>

      {/* Quick Info */}
      <View className="px-6 mb-6 gap-3">
        <InfoRow
          label="Гишүүнчлэл"
          value={dashboard?.member.membershipPlanName ?? "Томилогдоогүй"}
        />
        <InfoRow
          label="Хүчинтэй хугацаа"
          value={dashboard?.member.membershipEndDate ?? "—"}
        />
        <InfoRow
          label="Салбар"
          value={dashboard?.member.branchName ?? "—"}
        />
        <InfoRow
          label="Зорилго"
          value={dashboard?.member.trainingGoal ?? "—"}
        />
        <InfoRow
          label="Нийт дасгал"
          value={`${dashboard?.totalWorkouts ?? 0}`}
        />
        <InfoRow
          label="Дасгалын streak"
          value={`${dashboard?.workoutStreak ?? 0} өдөр`}
        />
      </View>

      {/* Actions */}
      <View className="px-6 py-4 gap-3">
        <Pressable className="rounded-xl border border-border p-4 active:opacity-70">
          <Text className="text-foreground text-center font-medium">
            Гишүүнчлэл сунгах
          </Text>
        </Pressable>

        <Pressable className="rounded-xl border border-border p-4 active:opacity-70">
          <Text className="text-foreground text-center font-medium">
            Амралт хүсэх
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            signOut();
            router.replace("/(auth)/role-select");
          }}
          className="rounded-xl border border-destructive/30 p-4 active:opacity-70"
        >
          <Text className="text-destructive text-center font-medium">
            Гарах
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between items-center rounded-xl border border-border bg-card px-4 py-3">
      <Text className="text-sm text-muted-foreground">{label}</Text>
      <Text className="text-sm font-medium text-card-foreground">{value}</Text>
    </View>
  );
}
