import { useState, useRef, useEffect } from "react";
import { View, Text, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth";
import { useMessages, useSendMessage, useMarkConversationRead, type Message } from "@/hooks/useMarketConversations";
import { PageHeader } from "@/components/ui/PageHeader";
import { Loading } from "@/components/ui/Loading";

function MessageBubble({ message, isOwn }: { message: Message; isOwn: boolean }) {
  return (
    <View className={`max-w-[80%] mb-2 ${isOwn ? "self-end" : "self-start"}`}>
      <View className={`rounded-2xl px-4 py-2 ${isOwn ? "bg-primary" : "bg-card border border-border"}`}>
        <Text className={isOwn ? "text-primary-foreground" : "text-foreground"}>{message.text}</Text>
      </View>
      <Text className="text-muted-foreground text-xs mt-0.5 px-2">
        {new Date(message.created_at).toLocaleTimeString("mn-MN", { hour: "2-digit", minute: "2-digit" })}
      </Text>
    </View>
  );
}

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [text, setText] = useState("");
  const flatListRef = useRef<FlatList>(null);

  const { data: messages = [], isPending } = useMessages(id);
  const sendMessage = useSendMessage(user?.id);
  const markRead = useMarkConversationRead(user?.id);

  useEffect(() => {
    if (id) markRead.mutate(id);
  }, [id]);

  const handleSend = () => {
    if (!text.trim() || !id) return;
    sendMessage.mutate({ conversationId: id, text: text.trim() });
    setText("");
  };

  return (
    <View className="flex-1 bg-background">
      <PageHeader title="Яриа" showBack />
      {isPending ? (
        <Loading />
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MessageBubble message={item} isOwn={item.sender_id === user?.id} />
          )}
          contentContainerClassName="px-4 py-2"
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
      )}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View className="flex-row items-center gap-2 px-4 py-3 border-t border-border">
          <TextInput
            className="flex-1 bg-card border border-border rounded-xl px-4 py-2.5 text-foreground"
            value={text}
            onChangeText={setText}
            placeholder="Мессеж..."
            placeholderTextColor="rgb(var(--muted-foreground))"
          />
          <TouchableOpacity
            className="bg-primary w-10 h-10 rounded-full items-center justify-center"
            onPress={handleSend}
            disabled={!text.trim() || sendMessage.isPending}
          >
            <Ionicons name="send" size={18} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
