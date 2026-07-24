import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface Document {
  id: string;
  owner_id: string;
  horse_id: string | null;
  title: string;
  doc_type: string;
  storage_path: string;
  mime_type: string;
  file_size: number | null;
  created_at: string;
  updated_at: string;
}

export function useDocuments(ownerId: string | undefined, horseId?: string) {
  return useQuery({
    queryKey: ["documents", ownerId, horseId],
    queryFn: async () => {
      if (!ownerId) return [];

      let query = supabase
        .from("documents")
        .select("*")
        .eq("owner_id", ownerId);

      if (horseId) {
        query = query.eq("horse_id", horseId);
      }

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });

      if (error) throw error;
      return data as Document[];
    },
    enabled: !!ownerId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useDocument(id: string | undefined) {
  return useQuery({
    queryKey: ["document", id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Document;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}
