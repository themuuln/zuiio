import { View, Text, ScrollView, Pressable } from "react-native";
import { useAuthStore } from "@/src/config/stores";
import { PreviewGymRepository } from "@/src/data/preview-repository";
import { useQuery } from "@tanstack/react-query";

const repo = new PreviewGymRepository();

export default function WorkoutsScreen() {
  const user = useAuthStore((s) => s.currentUser);

  const { data: templates, isPending } = useQuery({
    queryKey: ["workout-templates", user?.branchId],
    queryFn: () => repo.fetchWorkoutTemplates(user!.branchId),
    enabled: !!user,
  });

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="px-6 pt-6 pb-4">
        <Text className="text-2xl font-bold text-foreground">
          Дасгалууд
        </Text>
        <Text className="text-muted-foreground mt-1">
          Хөтөлбөр сонгоод дасгаалаа эхлээрэй
        </Text>
      </View>

      {isPending ? (
        <View className="px-6 py-10">
          <Text className="text-muted-foreground">Ачаалж байна...</Text>
        </View>
      ) : (
        <View className="px-6 gap-3">
          {templates?.map((t) => (
            <Pressable
              key={t.id}
              className="rounded-xl border border-border bg-card p-4 active:opacity-70"
            >
              <View className="flex-row justify-between items-start">
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-card-foreground">
                    {t.name}
                  </Text>
                  <Text className="text-sm text-muted-foreground mt-1">
                    {t.description}
                  </Text>
                </View>
                <View className="rounded-full bg-accent/10 px-3 py-1">
                  <Text className="text-xs font-medium text-accent">
                    {t.exercises.length} дасгал
                  </Text>
                </View>
              </View>

              <View className="mt-3 flex-row gap-2 flex-wrap">
                {t.exercises.slice(0, 3).map((ex) => (
                  <View
                    key={ex.id}
                    className="rounded-md bg-muted px-2 py-1"
                  >
                    <Text className="text-xs text-muted-foreground">
                      {ex.exerciseName}
                    </Text>
                  </View>
                ))}
                {t.exercises.length > 3 && (
                  <View className="rounded-md bg-muted px-2 py-1">
                    <Text className="text-xs text-muted-foreground">
                      +{t.exercises.length - 3} илүү
                    </Text>
                  </View>
                )}
              </View>

              <View className="mt-3 flex-row gap-4">
                <Text className="text-xs text-muted-foreground">
                  {t.exercises[0]?.targetSets} sets
                </Text>
                <Text className="text-xs text-muted-foreground">
                  {t.exercises[0]?.targetReps} reps
                </Text>
                <Text className="text-xs text-muted-foreground">
                  {t.exercises[0]?.restSeconds}s rest
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
