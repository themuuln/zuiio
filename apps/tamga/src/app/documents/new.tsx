import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useCreateDocument, useUploadDocumentFile } from "@/hooks/useDocumentMutations";
import { useHorses } from "@/hooks/useHorses";

const HARDCODED_USER_ID = "11111111-1111-1111-1111-111111111111";

const DOCUMENT_TYPE_OPTIONS = [
  { value: "guide", label: "Зөвлөгөө" },
  { value: "certificate", label: "Гэрчилгээ" },
  { value: "medical", label: "Эмнэлэг" },
  { value: "photo", label: "Зураг" },
  { value: "video", label: "Видео" },
];

function TypeButton({
  label,
  value,
  selected,
  onPress,
}: {
  label: string;
  value: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      className={`px-4 py-2 rounded-full border mr-2 mb-2 ${
        selected ? "bg-primary border-primary" : "bg-card border-border"
      }`}
      onPress={onPress}
    >
      <Text
        className={`text-sm ${
          selected
            ? "text-primary-foreground font-medium"
            : "text-muted-foreground"
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function NewDocumentScreen() {
  const router = useRouter();
  const createDocument = useCreateDocument();
  const uploadFile = useUploadDocumentFile();
  const { data: horses = [] } = useHorses(HARDCODED_USER_ID);

  const [title, setTitle] = useState("");
  const [documentType, setDocumentType] = useState("guide");
  const [selectedHorseId, setSelectedHorseId] = useState<string | null>(null);
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string>("image");
  const [fileName, setFileName] = useState<string>("");
  const [urlInput, setUrlInput] = useState("");

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Зөвшөөрөл", "Зураг сонгохын тулд зөвшөөрөл хэрэгтэй");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setFileUri(result.assets[0].uri);
      setFileType("image");
      setFileName(result.assets[0].uri.split("/").pop() ?? "image.jpg");
    }
  }

  async function pickVideo() {
    const { status } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Зөвшөөрөл", "Видео сонгохын тулд зөвшөөрөл хэрэгтэй");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setFileUri(result.assets[0].uri);
      setFileType("video");
      setFileName(result.assets[0].uri.split("/").pop() ?? "video.mp4");
    }
  }

  async function handleSubmit() {
    if (!title.trim()) {
      Alert.alert("Алдаа", "Гарчиг оруулна уу");
      return;
    }

    if (!fileUri && !urlInput.trim()) {
      Alert.alert("Алдаа", "Файл эсвэл URL оруулна уу");
      return;
    }

    try {
      let finalPath = urlInput.trim();
      let detectedFileType = fileType;
      let detectedMime = fileType === "video" ? "video/mp4" : "image/jpeg";

      if (fileUri) {
        const uploaded = await uploadFile.mutateAsync({
          uri: fileUri,
          name: fileName || "upload",
          type: fileType === "video" ? "video/mp4" : "image/jpeg",
        });
        finalPath = uploaded.path;
      }

      // Determine mime_type from URL if using URL input
      if (!fileUri && urlInput.trim()) {
        const url = urlInput.trim().toLowerCase();
        if (url.includes(".mp4") || url.includes(".mov") || url.includes("video")) {
          detectedFileType = "video";
          detectedMime = "video/mp4";
        } else if (url.includes(".pdf")) {
          detectedFileType = "pdf";
          detectedMime = "application/pdf";
        } else {
          detectedFileType = "image";
          detectedMime = "image/jpeg";
        }
      }

      await createDocument.mutateAsync({
        title: title.trim(),
        doc_type: documentType,
        storage_path: finalPath,
        mime_type: detectedMime,
        horse_id: selectedHorseId,
      });

      router.back();
    } catch {
      Alert.alert("Алдаа", "Баримт нэмэхэд алдаа гарлаа");
    }
  }

  const isSubmitting = createDocument.isPending || uploadFile.isPending;

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center gap-3 px-4 pt-12 pb-4 border-b border-border">
        <TouchableOpacity onPress={() => router.back()} className="p-1">
          <Ionicons
            name="arrow-back"
            size={24}
            className="text-foreground"
          />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-foreground flex-1">
          Баримт нэмэх
        </Text>
      </View>

      <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
        <View className="px-4 pt-4 pb-20">
          {/* Title */}
          <Text className="text-foreground font-bold mb-2">Гарчиг *</Text>
          <TextInput
            className="bg-card border border-border rounded-xl px-4 py-3 text-foreground mb-4"
            placeholder="Баримтын гарчиг"
            placeholderTextColor="rgb(var(--muted-foreground))"
            value={title}
            onChangeText={setTitle}
          />


          {/* Document Type */}
          <Text className="text-foreground font-bold mb-2">
            Баримтын төрөл *
          </Text>
          <View className="flex-row flex-wrap mb-4">
            {DOCUMENT_TYPE_OPTIONS.map((opt) => (
              <TypeButton
                key={opt.value}
                value={opt.value}
                label={opt.label}
                selected={documentType === opt.value}
                onPress={() => setDocumentType(opt.value)}
              />
            ))}
          </View>

          {/* Horse Selector */}
          <Text className="text-foreground font-bold mb-2">
            Холбоотой морь
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-4"
          >
            <TouchableOpacity
              className={`px-3 py-1.5 rounded-full border mr-2 ${
                selectedHorseId === null
                  ? "bg-primary border-primary"
                  : "bg-card border-border"
              }`}
              onPress={() => setSelectedHorseId(null)}
            >
              <Text
                className={`text-sm ${
                  selectedHorseId === null
                    ? "text-primary-foreground"
                    : "text-muted-foreground"
                }`}
              >
                Үгүй
              </Text>
            </TouchableOpacity>
            {horses.map((horse) => (
              <TouchableOpacity
                key={horse.id}
                className={`px-3 py-1.5 rounded-full border mr-2 ${
                  selectedHorseId === horse.id
                    ? "bg-primary border-primary"
                    : "bg-card border-border"
                }`}
                onPress={() => setSelectedHorseId(horse.id)}
              >
                <Text
                  className={`text-sm ${
                    selectedHorseId === horse.id
                      ? "text-primary-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {horse.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* File Upload */}
          <Text className="text-foreground font-bold mb-2">Файл</Text>

          {fileUri ? (
            <View className="bg-card border border-border rounded-xl p-3 mb-4">
              <View className="flex-row items-center gap-3">
                {fileType === "image" ? (
                  <Image
                    source={{ uri: fileUri }}
                    className="w-16 h-16 rounded-lg"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-16 h-16 rounded-lg bg-muted items-center justify-center">
                    <Ionicons name="videocam" size={24} className="text-primary" />
                  </View>
                )}
                <View className="flex-1">
                  <Text className="text-foreground font-medium" numberOfLines={1}>
                    {fileName}
                  </Text>
                  <Text className="text-muted-foreground text-xs">
                    {fileType === "image" ? "Зураг" : "Видео"}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setFileUri(null);
                    setFileName("");
                  }}
                >
                  <Ionicons
                    name="close-circle"
                    size={24}
                    className="text-destructive"
                  />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View className="flex-row gap-3 mb-4">
              <TouchableOpacity
                className="flex-1 bg-card border border-border rounded-xl p-4 items-center"
                onPress={pickImage}
              >
                <Ionicons name="image" size={24} className="text-primary mb-1" />
                <Text className="text-muted-foreground text-sm">Зураг сонгох</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-card border border-border rounded-xl p-4 items-center"
                onPress={pickVideo}
              >
                <Ionicons name="videocam" size={24} className="text-primary mb-1" />
                <Text className="text-muted-foreground text-sm">Видео сонгох</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* URL Input */}
          <Text className="text-foreground font-bold mb-2">Эсвэл URL</Text>
          <TextInput
            className="bg-card border border-border rounded-xl px-4 py-3 text-foreground mb-6"
            placeholder="https://example.com/document.pdf"
            placeholderTextColor="rgb(var(--muted-foreground))"
            value={urlInput}
            onChangeText={setUrlInput}
            keyboardType="url"
            autoCapitalize="none"
          />

          {/* Submit */}
          <TouchableOpacity
            className={`rounded-xl py-3 items-center ${
              isSubmitting ? "bg-primary/50" : "bg-primary"
            }`}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-primary-foreground font-bold text-lg">
                Хадгалах
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
