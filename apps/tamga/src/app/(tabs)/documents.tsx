import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth";
import { useDocuments, type Document } from "@/hooks/useDocuments";
import { useDeleteDocument } from "@/hooks/useDocumentMutations";
import { useState } from "react";

const DOCUMENT_TYPE_OPTIONS = [
  { value: "all", label: "Бүгд", icon: "folder-open" as const },
  { value: "guide", label: "Зөвлөгөө", icon: "book" as const },
  { value: "certificate", label: "Гэрчилгээ", icon: "ribbon" as const },
  { value: "medical", label: "Эмнэлэг", icon: "medkit" as const },
  { value: "photo", label: "Зураг", icon: "image" as const },
  { value: "video", label: "Видео", icon: "videocam" as const },
];

const FILE_TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  guide: "book-outline",
  certificate: "ribbon-outline",
  medical: "medkit-outline",
  photo: "image-outline",
  video: "videocam-outline",
};

function DocumentCard({
  document,
  onDelete,
}: {
  document: Document;
  onDelete: () => void;
}) {
  const date = new Date(document.created_at).toLocaleDateString("mn-MN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const typeIcon =
    FILE_TYPE_ICONS[document.doc_type] ?? "document-text-outline";

  return (
    <TouchableOpacity
      className="bg-card rounded-xl p-4 mb-3 border border-border"
      onLongPress={onDelete}
    >
      <View className="flex-row items-center gap-3">
        <View className="bg-muted w-10 h-10 rounded-lg items-center justify-center">
          <Ionicons name={typeIcon} size={20} className="text-primary" />
        </View>
        <View className="flex-1">
          <Text className="text-foreground font-bold" numberOfLines={1}>
            {document.title}
          </Text>
          <Text className="text-muted-foreground text-xs mt-1">{date}</Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={16}
          className="text-muted-foreground"
        />
      </View>
    </TouchableOpacity>
  );
}

export default function DocumentsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    data: documents = [],
    isLoading,
    error,
  } = useDocuments(user?.id);
  const deleteDocument = useDeleteDocument();
  const [activeFilter, setActiveFilter] = useState("all");

  const filteredDocuments =
    activeFilter === "all"
      ? documents
      : documents.filter((d) => d.doc_type === activeFilter);

  function handleDeleteDocument(doc: Document) {
    Alert.alert("Устгах", `"${doc.title}"-ийг устгах уу?`, [
      { text: "Үгүй", style: "cancel" },
      {
        text: "Тийм",
        style: "destructive",
        onPress: () =>
          deleteDocument.mutate({ id: doc.id, storage_path: doc.storage_path }),
      },
    ]);
  }

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" className="text-primary" />
        <Text className="text-muted-foreground mt-4">Ачаалж байна...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-6">
        <Ionicons
          name="alert-circle-outline"
          size={64}
          className="text-destructive"
        />
        <Text className="text-destructive mt-4 text-center">
          Алдаа гарлаа. Дахин оролдоно уу.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <View className="px-4 pt-12 pb-4">
        <Text className="text-2xl font-bold text-foreground">Баримт</Text>
        <Text className="text-muted-foreground">
          Морины эрүүл мэндийн зөвлөгөө, баримт бичиг
        </Text>
      </View>

      {/* Type filter */}
      <View className="px-4 mb-4">
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={DOCUMENT_TYPE_OPTIONS}
          keyExtractor={(item) => item.value}
          renderItem={({ item }) => {
            const isActive = activeFilter === item.value;
            return (
              <TouchableOpacity
                className={`px-3 py-1.5 rounded-full mr-2 border ${
                  isActive
                    ? "bg-primary border-primary"
                    : "bg-card border-border"
                }`}
                onPress={() => setActiveFilter(item.value)}
              >
                <Ionicons
                  name={item.icon}
                  size={14}
                  color={isActive ? "white" : "rgb(var(--muted-foreground))"}
                />
                <Text
                  className={`text-sm ml-1 ${
                    isActive
                      ? "text-primary-foreground font-medium"
                      : "text-muted-foreground"
                  }`}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {filteredDocuments.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons
            name="folder-open-outline"
            size={64}
            className="text-muted-foreground"
          />
          <Text className="text-muted-foreground mt-4 text-center">
            Хоосон баримт байхгүй{"\n"}Шинэ баримт нэмнэ үү
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredDocuments}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <DocumentCard
              document={item}
              onDelete={() => handleDeleteDocument(item)}
            />
          )}
          contentContainerClassName="px-4 pb-20"
        />
      )}

      <TouchableOpacity
        className="absolute bottom-6 right-6 bg-primary w-14 h-14 rounded-full items-center justify-center shadow-lg"
        onPress={() => router.push("/documents/new")}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
}
