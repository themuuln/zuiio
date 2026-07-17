import { useState, useMemo } from "react";
import { View, Text, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { addDays, differenceInDays, format } from "date-fns";
import { mn } from "date-fns/locale";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Progress } from "@/components/ui/Progress";
import { Badge } from "@/components/ui/Badge";

const GESTATION_DAYS = 340;

const MILESTONES = [
  { day: 30, label: "30-хоногийн шалгалт", icon: "medical-outline" },
  { day: 60, label: "60-хоногийн шалгалт", icon: "medical-outline" },
  { day: 120, label: "120-хоногийн шалгалт", icon: "medical-outline" },
  { day: 300, label: "300-хоногийн шалгалт", icon: "medical-outline" },
  { day: 340, label: "Төллөх хугацаа", icon: "child-care-outline" },
];

export default function GestationScreen() {
  const [breedingDate, setBreedingDate] = useState("");

  const parsed = useMemo(() => {
    if (!breedingDate) return null;
    const date = new Date(breedingDate);
    if (Number.isNaN(date.getTime())) return null;

    const dueDate = addDays(date, GESTATION_DAYS);
    const daysPassed = differenceInDays(new Date(), date);
    const daysRemaining = Math.max(0, GESTATION_DAYS - daysPassed);
    const progress = Math.min(100, (daysPassed / GESTATION_DAYS) * 100);
    const isOverdue = daysPassed > GESTATION_DAYS;

    return { date, dueDate, daysPassed, daysRemaining, progress, isOverdue };
  }, [breedingDate]);

  return (
    <View className="flex-1 bg-background">
      <PageHeader title="Гестацийн тооцоо" subtitle="340 хоногийн тооцоо" showBack />

      <ScrollView className="flex-1 px-4" contentContainerClassName="pb-20">
        <Input
          label="Үржил хийсэн огноо"
          value={breedingDate}
          onChangeText={setBreedingDate}
          placeholder="YYYY-MM-DD"
          keyboardType="numeric"
        />

        {parsed && (
          <>
            <Card className="mb-4">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-foreground font-semibold text-lg">Төлөв</Text>
                {parsed.isOverdue ? (
                  <Badge variant="destructive">Хугацаа хэтэрсэн!</Badge>
                ) : (
                  <Badge variant="success">{parsed.daysPassed} хоног</Badge>
                )}
              </View>
              <Progress value={parsed.progress} className="mb-3" />
              <View className="flex-row justify-between">
                <Text className="text-muted-foreground text-sm">
                  Үлдсэн: {parsed.daysRemaining} хоног
                </Text>
                <Text className="text-muted-foreground text-sm">
                  Төлөх: {format(parsed.dueDate, "yyyy-MM-dd")}
                </Text>
              </View>
            </Card>

            <Text className="text-foreground font-semibold mb-3">Эмчилгээний шалгалтууд</Text>
            {MILESTONES.map((m) => {
              const milestoneDate = addDays(parsed.date, m.day);
              const isPast = parsed.daysPassed >= m.day;
              const isNext = !isPast && MILESTONES.findIndex((x) => x.day === m.day) ===
                MILESTONES.findIndex((x) => x.day > parsed.daysPassed);

              return (
                <Card key={m.day} className={`mb-2 ${isPast ? "opacity-60" : ""}`}>
                  <View className="flex-row items-center gap-3">
                    <Ionicons
                      name={m.icon as any}
                      size={20}
                      className={isPast ? "text-muted-foreground" : isNext ? "text-primary" : "text-muted-foreground"}
                    />
                    <View className="flex-1">
                      <Text className={`font-medium ${isPast ? "text-muted-foreground" : "text-foreground"}`}>
                        {m.label}
                      </Text>
                      <Text className="text-muted-foreground text-xs">
                        {format(milestoneDate, "yyyy-MM-dd")}
                      </Text>
                    </View>
                    {isPast && <Ionicons name="checkmark-circle" size={18} className="text-emerald-500" />}
                    {isNext && <Badge>Дараагийн</Badge>}
                  </View>
                </Card>
              );
            })}
          </>
        )}
      </ScrollView>
    </View>
  );
}
