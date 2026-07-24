import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  type Notification,
} from "@/hooks/useNotifications";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";

function timeAgo(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 60) return "Одоо";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} мкн`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} цаг`;
  return `${Math.floor(diffSec / 86400)} өдөр`;
}

function NotificationItem({
  notification,
  onPress,
}: {
  notification: Notification;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className={`mx-4 mb-2 rounded-xl p-4 border ${
        notification.read
          ? "bg-card border-border"
          : "bg-primary/5 border-primary/20"
      }`}
    >
      <View className="flex-row items-start gap-3">
        <View
          className={`mt-0.5 w-8 h-8 rounded-full items-center justify-center ${
            notification.read ? "bg-muted" : "bg-primary/10"
          }`}
        >
          <Ionicons
            name="notifications-outline"
            size={16}
            color={
              notification.read
                ? "rgb(var(--muted-foreground))"
                : "rgb(var(--primary))"
            }
          />
        </View>
        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-1">
            <Text
              className={`text-sm ${
                notification.read
                  ? "text-foreground font-normal"
                  : "text-foreground font-semibold"
              }`}
              numberOfLines={1}
            >
              {notification.title}
            </Text>
            {!notification.read && (
              <View className="w-2 h-2 rounded-full bg-primary ml-2" />
            )}
          </View>
          <Text className="text-sm text-muted-foreground" numberOfLines={2}>
            {notification.body}
          </Text>
          <Text className="text-xs text-muted-foreground mt-1">
            {timeAgo(notification.created_at)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const { user } = useAuth();
  const {
    data: notifications = [],
    isPending,
    error,
    refetch,
  } = useNotifications(user?.id);
  const markRead = useMarkNotificationRead(user?.id);
  const markAllRead = useMarkAllNotificationsRead(user?.id);

  function handlePress(notification: Notification) {
    if (!notification.read) {
      markRead.mutate(notification.id);
    }
  }

  if (isPending) {
    return <LoadingState text="Мэдэгдэл ачаалж байна..." />;
  }

  if (error) {
    return (
      <ErrorState
        message="Мэдэгдэл ачаалахад алдаа гарлаа"
        onRetry={() => refetch()}
      />
    );
  }

  const hasNotifications = notifications.length > 0;
  const hasUnread = notifications.some((n) => !n.read);

  return (
    <View className="flex-1 bg-background">
      {hasNotifications && hasUnread && (
        <View className="px-4 pt-3 pb-1 items-end">
          <TouchableOpacity
            onPress={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="py-1 px-3"
          >
            <Text className="text-primary text-sm font-medium">
              {markAllRead.isPending
                ? "Тэмдэглэж байна..."
                : "Бүгдийг уншсан болгох"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NotificationItem
            notification={item}
            onPress={() => handlePress(item)}
          />
        )}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 20 }}
        ListEmptyComponent={
          <EmptyState
            icon="notifications-off-outline"
            title="Мэдэгдэл байхгүй"
            subtitle="Шинэ мэдэгдэл ирэхэд энд харагдах болно"
          />
        }
      />
    </View>
  );
}
