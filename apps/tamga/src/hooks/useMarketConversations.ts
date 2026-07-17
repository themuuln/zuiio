import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface Conversation {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  last_message: string | null;
  last_message_at: string | null;
  created_at: string;
  other_party_name?: string;
  unread_count?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  text: string;
  read: boolean;
  created_at: string;
}

export function useMarketConversations(userId: string | undefined) {
  return useQuery({
    queryKey: ["market-conversations", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("market_conversations")
        .select("*")
        .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
        .order("last_message_at", { ascending: false });
      if (error) throw error;
      return data as Conversation[];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useMessages(conversationId: string | undefined) {
  return useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      const { data, error } = await supabase
        .from("market_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Message[];
    },
    enabled: !!conversationId,
    staleTime: 1000 * 30,
  });
}

export function useSendMessage(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ conversationId, text }: { conversationId: string; text: string }) => {
      if (!userId) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("market_messages")
        .insert({ conversation_id: conversationId, sender_id: userId, text, read: false })
        .select()
        .single();
      if (error) throw error;
      await supabase
        .from("market_conversations")
        .update({ last_message: text, last_message_at: new Date().toISOString() })
        .eq("id", conversationId);
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["messages", vars.conversationId] });
      qc.invalidateQueries({ queryKey: ["market-conversations", userId] });
    },
  });
}

export function useMarkConversationRead(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (conversationId: string) => {
      if (!userId) return;
      await supabase
        .from("market_messages")
        .update({ read: true })
        .eq("conversation_id", conversationId)
        .neq("sender_id", userId);
    },
    onSuccess: (_, conversationId) => {
      qc.invalidateQueries({ queryKey: ["messages", conversationId] });
      qc.invalidateQueries({ queryKey: ["market-conversations", userId] });
    },
  });
}

export function useCreateConversation(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ listingId, sellerId }: { listingId: string; sellerId: string }) => {
      if (!userId) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("market_conversations")
        .insert({ listing_id: listingId, buyer_id: userId, seller_id: sellerId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["market-conversations", userId] }),
  });
}
