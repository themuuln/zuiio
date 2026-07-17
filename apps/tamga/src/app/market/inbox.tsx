import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/lib/auth";
import { useMarketConversations, type Conversation } from "@/hooks/useMarketConversations";
import { PageHeader } from "@/components/ui/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Loading } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/states";
import { formatDistanceToNow } from "date-fns";
import { mn } from "date-fns/locale";

function ConversationCard({ conversation }: { conversation: Conversation }) {
  const router = useRouter();

  return (
    <TouchableOpacity
      className="flex-row items-center gap-3 py-3 border-b border-border"
      onPress={() => router.push(`/market/conversation/${conversation.id}` as any)}
    >
      <Avatar name={conversation.other_party_name ?? "?"} />
      <View className="flex-1">
        <View className="flex-row justify-between items-center">
          <Text className="text-foreground font-medium">{conversation.other_party_name ?? "Хэрэглэгч"}</Text>
          {conversation.last_message_at && (
            <Text className="text-muted-foreground text-xs">
              {formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true, locale: mn })}
            </Text>
          )}
        </View>
        <Text className="text-muted-foreground text-sm" numberOfLines={1}>
          {conversation.last_message ?? "Мессеж байхгүй"}
        </Text>
      </View>
      {(conversation.unread_count ?? 0) > 0 && (
        <Badge>{conversation.unread_count}</Badge>
      )}
    </TouchableOpacity>
  );
}

export default function MarketInboxScreen() {
  const { user } = useAuth();
  const { data: conversations = [], isPending, error, refetch } = useMarketConversations(user?.id);

  return (
    <View className="flex-1 bg-background">
      <PageHeader title="Ярианы жагсаалт" subtitle="Зах зээлийн яриа" showBack />
      {isPending ? (
        <Loading />
      ) : error ? (
        <ErrorState onRetry={refetch} />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ConversationCard conversation={item} />}
          contentContainerClassName="px-4 pb-20"
          ListEmptyComponent={
            <EmptyState icon="chatbubbles-outline" title="Яриа байхгүй" subtitle="Зар дээр мессеж илгээнэ үү" />
          }
        />
      )}
    </View>
  );
}
