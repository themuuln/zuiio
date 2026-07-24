import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUpdater } from "@/lib/updater";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";

export default function UpdaterScreen() {
  const {
    available,
    currentVersion,
    availableVersion,
    isDownloading,
    isInstalling,
    error,
    checkForUpdate,
    downloadAndInstall,
  } = useUpdater();

  return (
    <View className="flex-1 bg-background">
      <PageHeader title="Шинэчлэлт" subtitle="Аппликейшн шинэчлэх" showBack />

      <View className="px-4 pt-4 gap-4">
        {/* Current Version */}
        <Card>
          <View className="flex-row items-center gap-3">
            <Ionicons name="information-circle-outline" size={24} className="text-primary" />
            <View className="flex-1">
              <Text className="text-foreground font-medium">Одоогийн хувилбар</Text>
              <Text className="text-muted-foreground text-sm">{currentVersion}</Text>
            </View>
          </View>
        </Card>

        {/* Update Status */}
        {available ? (
          <Card className="border-primary/30">
            <View className="flex-row items-center gap-3 mb-3">
              <Ionicons name="arrow-up-circle-outline" size={24} className="text-primary" />
              <View className="flex-1">
                <Text className="text-foreground font-medium">Шинэ хувилбар байна!</Text>
                {availableVersion && (
                  <Text className="text-muted-foreground text-sm">Хувилбар: {availableVersion}</Text>
                )}
              </View>
              <Badge variant="success">Шинэ</Badge>
            </View>

            {isDownloading && (
              <View className="mt-2">
                <Text className="text-muted-foreground text-sm mb-2">Татаж байна...</Text>
                <Progress value={50} />
              </View>
            )}

            {isInstalling && (
              <View className="mt-2">
                <Text className="text-primary text-sm font-medium">
                  Суулгаж байна... Апп дахин ачаалагдана
                </Text>
              </View>
            )}

            {!isDownloading && !isInstalling && (
              <TouchableOpacity
                className="bg-primary rounded-xl py-3 items-center"
                onPress={downloadAndInstall}
              >
                <Text className="text-primary-foreground font-semibold">
                  Шинэчлэх
                </Text>
              </TouchableOpacity>
            )}
          </Card>
        ) : (
          <Card>
            <View className="flex-row items-center gap-3">
              <Ionicons name="checkmark-circle-outline" size={24} className="text-emerald-500" />
              <Text className="text-foreground">
                Хамгийн сүүлийн хувилбар дээр байна
              </Text>
            </View>
          </Card>
        )}

        {error && (
          <Card className="border-destructive/30">
            <View className="flex-row items-center gap-3">
              <Ionicons name="alert-circle-outline" size={24} className="text-destructive" />
              <Text className="text-destructive text-sm flex-1">{error}</Text>
            </View>
          </Card>
        )}

        {/* Manual Check */}
        <TouchableOpacity
          className="bg-card border border-border rounded-xl py-3 items-center"
          onPress={checkForUpdate}
          disabled={isDownloading || isInstalling}
        >
          <Text className="text-foreground font-medium">
            Шинэчлэлт шалгах
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
