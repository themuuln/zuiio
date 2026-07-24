import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import * as FileSystem from "expo-file-system";

interface UploadVideoInput {
  horse_id: string;
  race_id?: string;
  title: string;
  description?: string;
  uri: string;
}

export function useUploadRaceVideo(userId: string | undefined) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: UploadVideoInput) => {
      if (!userId) throw new Error("Not authenticated");

      // Upload to Supabase Storage
      const ext = input.uri.split(".").pop() ?? "mp4";
      const path = `${userId}/${Date.now()}.${ext}`;

      const fileData = await FileSystem.readAsStringAsync(input.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const { error: uploadError } = await supabase.storage
        .from("race-videos")
        .upload(path, decode(fileData), {
          contentType: `video/${ext}`,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("race-videos")
        .getPublicUrl(path);

      const { data, error } = await supabase
        .from("race_videos")
        .insert({
          horse_id: input.horse_id,
          race_id: input.race_id ?? null,
          title: input.title,
          description: input.description ?? null,
          video_url: urlData.publicUrl,
          owner_id: userId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["race-videos", userId] });
    },
  });
}

function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
