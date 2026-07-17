import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth";
import { useHorses, type Horse } from "@/hooks/useHorses";
import { usePedigree } from "@/hooks/usePedigree";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState, ErrorState } from "@/components/states";

// ---------------------------------------------------------------------------
// Horse picker — horizontal scroll of chips
// ---------------------------------------------------------------------------

function HorsePicker({
  horses,
  selectedId,
  onSelect,
}: {
  horses: Horse[];
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  return (
    <FlatList
      data={horses}
      keyExtractor={(item) => item.id}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="px-4 py-3 gap-2"
      renderItem={({ item }) => {
        const active = item.id === selectedId;
        return (
          <TouchableOpacity
            onPress={() => onSelect(item.id)}
            className={`rounded-full px-4 py-2 ${
              active
                ? "bg-primary"
                : "bg-card border border-border"
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                active ? "text-primary-foreground" : "text-foreground"
              }`}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        );
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Single pedigree node card
// ---------------------------------------------------------------------------

function PedigreeCard({
  name,
  birthYear,
  coat,
  verified,
}: {
  name?: string;
  birthYear?: number;
  coat?: string;
  verified?: boolean;
}) {
  if (!name) {
    return (
      <Card className="border-dashed opacity-50 min-w-[130px] max-w-[160px]">
        <Text className="text-muted-foreground text-xs italic">
          Мэдээлэл байхгүй
        </Text>
      </Card>
    );
  }

  return (
    <Card className="min-w-[130px] max-w-[160px]">
      <View className="flex-row items-center gap-1 flex-wrap">
        <Text className="text-foreground font-semibold text-sm" numberOfLines={1}>
          {name}
        </Text>
        {verified && (
          <Badge variant="success">
            <Ionicons name="checkmark-circle" size={10} color="white" />
          </Badge>
        )}
      </View>
      <Text className="text-muted-foreground text-xs mt-1">
        {[birthYear, coat].filter(Boolean).join(" · ")}
      </Text>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Grandparent column — fetches ancestors of one parent
// ---------------------------------------------------------------------------

function GrandparentColumn({
  parentId,
  label,
}: {
  parentId?: string;
  label: string;
}) {
  const { data: links } = usePedigree(parentId);
  const sire = links?.find((l) => l.relation === "sire");
  const dam = links?.find((l) => l.relation === "dam");

  return (
    <View className="gap-2">
      <Text className="text-[11px] text-muted-foreground font-medium">
        {label}
      </Text>
      <PedigreeCard
        name={sire?.parent_name}
        birthYear={sire?.parent_birth_year}
        coat={sire?.parent_coat}
        verified={sire?.verified}
      />
      <PedigreeCard
        name={dam?.parent_name}
        birthYear={dam?.parent_birth_year}
        coat={dam?.parent_coat}
        verified={dam?.verified}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Pedigree tree — horizontal left-to-right 3-generation layout
// ---------------------------------------------------------------------------

function PedigreeTree({
  horseId,
  horse,
}: {
  horseId: string;
  horse: Horse;
}) {
  const { data: links, isPending, error, refetch } = usePedigree(horseId);

  const sire = links?.find((l) => l.relation === "sire");
  const dam = links?.find((l) => l.relation === "dam");

  if (isPending) {
    return <LoadingState text="Удам судлал ачаалж байна..." />;
  }

  if (error) {
    return <ErrorState onRetry={refetch} />;
  }

  const noLinks = !links || links.length === 0;
  const age = new Date().getFullYear() - horse.birth_year;

  return (
    <ScrollView
      horizontal
      className="flex-1"
      showsHorizontalScrollIndicator={false}
    >
      <View className="flex-row items-stretch p-4" style={{ minHeight: 320 }}>
        {/* ── Column 0: Root horse ── */}
        <View className="justify-center mr-2" style={{ width: 155 }}>
          <Card className="bg-primary/10 border-primary/30">
            <Text className="text-[10px] text-primary font-semibold uppercase tracking-wide mb-1">
              Үндсэн морь
            </Text>
            <Text
              className="text-foreground font-bold text-base"
              numberOfLines={1}
            >
              {horse.name}
            </Text>
            <Text className="text-muted-foreground text-xs mt-1">
              {horse.birth_year} · {horse.coat} · {age} нас
            </Text>
          </Card>
        </View>

        {/* ── Connector ── */}
        <View className="w-5 justify-center">
          <View className="h-px bg-border w-full" />
        </View>

        {/* ── Column 1: Parents ── */}
        <View
          className="justify-between mr-2"
          style={{ width: 155, paddingVertical: 32 }}
        >
          <View>
            <Text className="text-[10px] text-muted-foreground font-medium mb-1">
              Аав
            </Text>
            <PedigreeCard
              name={sire?.parent_name}
              birthYear={sire?.parent_birth_year}
              coat={sire?.parent_coat}
              verified={sire?.verified}
            />
          </View>
          <View>
            <Text className="text-[10px] text-muted-foreground font-medium mb-1">
              Ээж
            </Text>
            <PedigreeCard
              name={dam?.parent_name}
              birthYear={dam?.parent_birth_year}
              coat={dam?.parent_coat}
              verified={dam?.verified}
            />
          </View>
        </View>

        {/* ── Connectors ── */}
        <View className="w-5 justify-between" style={{ paddingVertical: 56 }}>
          <View className="h-px bg-border w-full" />
          <View className="h-px bg-border w-full" />
        </View>

        {/* ── Column 2: Grandparents ── */}
        <View className="justify-between" style={{ paddingVertical: 8 }}>
          <GrandparentColumn
            parentId={sire?.parent_id}
            label="Аавын эцэг эх"
          />
          <GrandparentColumn
            parentId={dam?.parent_id}
            label="Ээжийн эцэг эх"
          />
        </View>

        {/* ── No-data hint inside tree ── */}
        {noLinks && (
          <View className="ml-4 justify-center" style={{ width: 140 }}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              className="text-muted-foreground"
            />
            <Text className="text-muted-foreground text-xs mt-2 text-center">
              Энэ морины удам судалгаа бүртгэгдээгүй байна
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function LineageScreen() {
  const { user, loading: authLoading } = useAuth();
  const { data: horses, isPending: horsesPending } = useHorses(user?.id);
  const [selectedId, setSelectedId] = useState<string | undefined>();

  const selectedHorse = horses?.find((h) => h.id === selectedId);

  // Loading — auth or horses
  if (authLoading || horsesPending) {
    return (
      <View className="flex-1 bg-background">
        <View className="px-4 pt-12 pb-4">
          <Text className="text-2xl font-bold text-foreground">
            Удам судлал
          </Text>
        </View>
        <LoadingState text="Морь ачаалж байна..." />
      </View>
    );
  }

  // No horses at all
  const noHorses = !horses || horses.length === 0;

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="px-4 pt-12 pb-2">
        <Text className="text-2xl font-bold text-foreground">
          Удам судлал
        </Text>
        <Text className="text-muted-foreground">
          Морины удам судлалын мод
        </Text>
      </View>

      {/* Horse picker */}
      {!noHorses && (
        <HorsePicker
          horses={horses}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      )}

      {/* Content */}
      {selectedHorse ? (
        <PedigreeTree horseId={selectedId!} horse={selectedHorse} />
      ) : noHorses ? (
        <EmptyState
          icon="paw-outline"
          title="Морь байхгүй байна"
          subtitle="Удам судлал үзэхийн тулд эхлээд морь нэмнэ үү"
        />
      ) : (
        <EmptyState
          icon="git-network-outline"
          title="Морь сонгоно уу"
          subtitle="Дээрх жагсаалтаас морь сонгоод удам судлалыг харна уу"
        />
      )}
    </View>
  );
}
