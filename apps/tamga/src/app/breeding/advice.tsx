import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Alert,
} from "react-native";
import {
  useAiBreedingAdvice,
  type BreedingAdvice,
} from "@/hooks/useAiBreeding";
import { useHorses, type Horse } from "@/hooks/useHorses";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { Chip } from "@/components/ui/Chip";
import { LoadingState } from "@/components/states";

/* ─── Horse selector ──────────────────────────────────────────────────────── */

function HorseSelector({
  label,
  selected,
  onSelect,
  horses,
  excludeId,
}: {
  label: string;
  selected: Horse | null;
  onSelect: (h: Horse | null) => void;
  horses: Horse[];
  excludeId?: string;
}) {
  const filtered = horses.filter((h) => h.id !== excludeId);

  if (selected) {
    return (
      <Card className="mb-3">
        <Text className="text-sm font-semibold text-muted-foreground mb-2">
          {label}
        </Text>
        <View className="flex-row items-center justify-between bg-secondary/50 rounded-xl px-4 py-3">
          <View className="flex-1">
            <Text className="text-foreground font-semibold">{selected.name}</Text>
            <Text className="text-muted-foreground text-sm">
              {genderLabel(selected.gender)} · {selected.coat || "—"} ·{" "}
              {new Date().getFullYear() - selected.birth_year} нас
            </Text>
          </View>
          <Chip label="✕" selected={false} onPress={() => onSelect(null)} />
        </View>
      </Card>
    );
  }

  return (
    <Card className="mb-3">
      <Text className="text-sm font-semibold text-muted-foreground mb-2">
        {label}
      </Text>
      {filtered.length === 0 ? (
        <Text className="text-muted-foreground text-sm py-2">
          Морь байхгүй байна
        </Text>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2"
        >
          {filtered.map((h) => (
            <Chip
              key={h.id}
              label={`${h.name} (${genderLabel(h.gender)})`}
              onPress={() => onSelect(h)}
            />
          ))}
        </ScrollView>
      )}
    </Card>
  );
}

/* ─── Compatibility score card ────────────────────────────────────────────── */

function CompatibilityScoreCard({ score }: { score: number }) {
  const label =
    score >= 80 ? "Маш өндөр" : score >= 60 ? "Өндөр" : score >= 40 ? "Дунд" : "Бага";
  const variant =
    score >= 80
      ? "success"
      : score >= 60
        ? "default"
        : score >= 40
          ? "warning"
          : "destructive";

  return (
    <Card className="mb-3 items-center">
      <Text className="text-sm font-semibold text-muted-foreground mb-3">
        Нийцэл
      </Text>
      <View className="w-full mb-2">
        <Progress value={score} className="h-3" />
      </View>
      <View className="flex-row items-center gap-2">
        <Text className="text-3xl font-bold text-foreground">{score}%</Text>
        <Badge variant={variant}>{label}</Badge>
      </View>
    </Card>
  );
}

/* ─── Risk level badge ────────────────────────────────────────────────────── */

function RiskLevelBadge({ level }: { level: BreedingAdvice["risk_level"] }) {
  const config = {
    low: { label: "Бага", variant: "success" as const },
    medium: { label: "Дунд", variant: "warning" as const },
    high: { label: "Өндөр", variant: "destructive" as const },
  }[level];

  return (
    <Card className="mb-3">
      <Text className="text-sm font-semibold text-muted-foreground mb-2">
        Эрсдэл
      </Text>
      <Badge variant={config.variant}>{config.label}</Badge>
    </Card>
  );
}

/* ─── Strengths / Weaknesses lists ────────────────────────────────────────── */

function TraitList({
  title,
  items,
  variant,
}: {
  title: string;
  items: string[];
  variant: "success" | "destructive";
}) {
  if (items.length === 0) return null;

  return (
    <Card className="mb-3">
      <Text className="text-sm font-semibold text-muted-foreground mb-2">
        {title}
      </Text>
      {items.map((item, i) => (
        <View key={i} className="flex-row items-start gap-2 mb-1 last:mb-0">
          <Badge variant={variant}>●</Badge>
          <Text className="text-foreground text-sm flex-1 leading-5">{item}</Text>
        </View>
      ))}
    </Card>
  );
}

/* ─── Inbreeding risk card ────────────────────────────────────────────────── */

function InbreedingCard({ text }: { text: string }) {
  return (
    <Card className="mb-3 border-l-4 border-l-amber-500">
      <Text className="text-sm font-semibold text-muted-foreground mb-1">
        Цусан ойртолтын эрсдэл
      </Text>
      <Text className="text-foreground text-sm leading-5">{text}</Text>
    </Card>
  );
}

/* ─── Recommendation card ─────────────────────────────────────────────────── */

function RecommendationCard({ text }: { text: string }) {
  return (
    <Card className="mb-3 border-l-4 border-l-primary">
      <Text className="text-sm font-semibold text-muted-foreground mb-1">
        Зөвлөмж
      </Text>
      <Text className="text-foreground leading-5">{text}</Text>
    </Card>
  );
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function genderLabel(gender: Horse["gender"]) {
  return gender === "stallion"
    ? "Азарга"
    : gender === "mare"
      ? "Эмгэн"
      : "Ялгасан";
}

/* ─── Main screen ─────────────────────────────────────────────────────────── */

export default function BreedingAdviceScreen() {
  const { user, loading: authLoading } = useAuth();
  const { data: horses = [], isPending: horsesPending } = useHorses(user?.id);
  const advice = useAiBreedingAdvice();

  const [sire, setSire] = useState<Horse | null>(null);
  const [dam, setDam] = useState<Horse | null>(null);

  const result = advice.data as BreedingAdvice | undefined;
  const loading = advice.isPending;
  const error = advice.error;

  function handleAnalyze() {
    if (!sire || !dam) {
      Alert.alert("Анхааруулга", "Азарга болон эмгэн хоёрлоо сонгоно уу");
      return;
    }
    if (sire.id === dam.id) {
      Alert.alert("Алдаа", "Нэг морийг сонгож болохгүй");
      return;
    }
    advice.mutate({ sireId: sire.id, damId: dam.id });
  }

  if (authLoading || horsesPending) {
    return <LoadingState />;
  }

  return (
    <View className="flex-1 bg-background">
      <PageHeader
        title="Зөвлөх зөвлөмж"
        subtitle="AI-н үржлийн зөвлөгөө"
        showBack
      />

      <ScrollView className="flex-1 px-4" contentContainerClassName="pb-8">
        {/* Horse selectors */}
        <HorseSelector
          label="Азарга (Сүр)"
          selected={sire}
          onSelect={setSire}
          horses={horses}
          excludeId={dam?.id}
        />
        <HorseSelector
          label="Эмгэн (Дам)"
          selected={dam}
          onSelect={setDam}
          horses={horses}
          excludeId={sire?.id}
        />

        {/* Analyze button */}
        <Button
          title={loading ? "Шинжилж байна..." : "Зөвлөх"}
          loading={loading}
          disabled={!sire || !dam || loading}
          className="mb-6"
          onPress={handleAnalyze}
        />

        {/* Error state */}
        {error && (
          <Card className="mb-3 border-l-4 border-l-destructive">
            <Text className="text-destructive font-medium">
              Шинжилгээний алдаа
            </Text>
            <Text className="text-muted-foreground text-sm mt-1">
              {error instanceof Error
                ? error.message
                : "Дахин оролдоно уу"}
            </Text>
          </Card>
        )}

        {/* Results */}
        {result && (
          <>
            <CompatibilityScoreCard score={result.compatibility_score} />
            <RiskLevelBadge level={result.risk_level} />
            <InbreedingCard text={result.inbreeding_risk} />
            <TraitList
              title="Давуу тал"
              items={result.strengths}
              variant="success"
            />
            <TraitList
              title="Сул тал"
              items={result.weaknesses}
              variant="destructive"
            />
            <RecommendationCard text={result.recommendation} />

            {/* Disclaimer */}
            <Card className="mt-2 bg-secondary/50">
              <Text className="text-muted-foreground text-xs leading-4 italic">
                {result.disclaimer}
              </Text>
            </Card>
          </>
        )}
      </ScrollView>
    </View>
  );
}
