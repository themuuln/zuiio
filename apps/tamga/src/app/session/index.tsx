import { View, Text, FlatList, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth";
import { useSessions, type UserSession } from "@/hooks/useSession";
import { useRevokeSession, useRevokeAllSessions } from "@/hooks/useSessionMutations";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Loading } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/states";
import { formatDistanceToNow } from "date-fns";
import { mn } from "date-fns/locale";

function SessionCard({
  session,
  onRevoke,
}: {
  session: UserSession;
  onRevoke: (id: string) => void;
}) {
  return (
    <Card className="mb-3">
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <View className="flex-row items-center gap-2 mb-1">
            <Ionicons
              name={
                session.device_type === "mobile"
                  ? "phone-portrait-outline"
                  : session.device_type === "desktop"
                    ? "desktop-outline"
                    : "globe-outline"
              }
              size={16}
              className="text-muted-foreground"
            />
            <Text className="text-foreground font-medium">
              {session.device_name ?? "Төхөөрөмж"}
            </Text>
            {session.is_current && (
              <Badge variant="success">Идэвхитэй</Badge>
            )}
          </View>
          <Text className="text-muted-foreground text-xs">
            Сүүлд идэвхилсэн:{" "}
            {formatDistanceToNow(new Date(session.last_active), {
              addSuffix: true,
              locale: mn,
            })}
          </Text>
          {session.ip_address && (
            <Text className="text-muted-foreground text-xs mt-1">
              IP: {session.ip_address}
            </Text>
          )}
        </View>
        {!session.is_current && (
          <TouchableOpacity
            onPress={() =>
              Alert.alert(
                "Сесс цуцлах",
                "Энэ сессийг цуцлах уу?",
                [
                  { text: "Үгүй", style: "cancel" },
                  { text: "Цуцлах", style: "destructive", onPress: () => onRevoke(session.id) },
                ]
              )
            }
          >
            <Ionicons name="trash-outline" size={18} className="text-destructive" />
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );
}

export default function SessionScreen() {
  const { user } = useAuth();
  const { data: sessions = [], isPending, error, refetch } = useSessions(user?.id);
  const revokeSession = useRevokeSession(user?.id);
  const revokeAll = useRevokeAllSessions(user?.id);

  const handleRevokeAll = () => {
    Alert.alert(
      "Бүх сессийг цуцлах",
      "Бусад бүх төхөөрөмжийн сессийг цуцлах уу?",
      [
        { text: "Үгүй", style: "cancel" },
        {
          text: "Цуцлах бүгдийг",
          style: "destructive",
          onPress: () => revokeAll.mutate(),
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-background">
      <PageHeader
        title="Сессүүд"
        subtitle="Нэвтрэх сессүүд"
        showBack
        rightAction={
          sessions.filter((s) => !s.is_current).length > 0 ? (
            <TouchableOpacity onPress={handleRevokeAll}>
              <Text className="text-destructive text-sm font-medium">
                Бүгдийг цуцлах
              </Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      {isPending ? (
        <Loading />
      ) : error ? (
        <ErrorState onRetry={refetch} />
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SessionCard
              session={item}
              onRevoke={(id) => revokeSession.mutate(id)}
            />
          )}
          contentContainerClassName="px-4 pb-20"
          ListEmptyComponent={
            <EmptyState
              icon="phone-portrait-outline"
              title="Сесс байхгүй"
              subtitle="Нэвтрэх сессүүд энд гарч ирнэ"
            />
          }
        />
      )}
    </View>
  );
}
