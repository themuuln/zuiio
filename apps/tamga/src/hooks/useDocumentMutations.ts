import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

const HARDCODED_USER_ID = "11111111-1111-1111-1111-111111111111";

export function useCreateDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (document: {
      title: string;
      doc_type: string;
      storage_path: string;
      mime_type: string;
      file_size?: number;
      horse_id?: string | null;
    }) => {
      const { data, error } = await supabase
        .from("documents")
        .insert({
          ...document,
          owner_id: HARDCODED_USER_ID,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (document: { id: string; storage_path: string }) => {
      // Try to delete from storage if there's a storage path
      if (document.storage_path) {
        await supabase.storage.from("documents").remove([document.storage_path]);
      }

      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", document.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

export function useUploadDocumentFile() {
  return useMutation({
    mutationFn: async (file: { uri: string; name: string; type: string }) => {
      const response = await fetch(file.uri);
      const blob = await response.blob();
      const filePath = `${HARDCODED_USER_ID}/${Date.now()}_${file.name}`;

      const { data, error } = await supabase.storage
        .from("documents")
        .upload(filePath, blob, {
          contentType: file.type,
        });

      if (error) throw error;

      return { path: data.path };
    },
  });
}
