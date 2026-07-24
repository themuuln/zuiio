import { useState, useMemo, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useHorses, type Horse } from "@/hooks/useHorses";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState, LoadingState } from "@/components/states";

// ── Common ancestor with path info ─────────────────────────────────────────
interface CommonAncestor {
  ancestorId: string;
  ancestorName: string;
  sireGenerations: number;
  damGenerations: number;
  pathLength: number; // sireGenerations + damGenerations
  contributionPercent: number;
}

// ── Risk level config ──────────────────────────────────────────────────────
interface RiskLevel {
  label: string;
  badgeVariant: "success" | "warning" | "destructive";
  color: string;
}

const RISK_LEVELS: Record<"safe" | "caution" | "danger", RiskLevel> = {
  safe: { label: "Аюулгүй", badgeVariant: "success", color: "text-emerald-500" },
  caution: { label: "Анхааралтай", badgeVariant: "warning", color: "text-amber-500" },
  danger: { label: "Эрсдэлтэй", badgeVariant: "destructive", color: "text-red-500" },
};

function getRiskLevel(coefficient: number): RiskLevel {
  if (coefficient > 12.5) return RISK_LEVELS.danger;
  if (coefficient >= 6.25) return RISK_LEVELS.caution;
  return RISK_LEVELS.safe;
}


// ── Wright's inbreeding coefficient calculator ─────────────────────────────
async function calculateInbreeding(
  horseId: string,
  maxDepth: number = 5,
): Promise<{
  coefficient: number;
  commonAncestors: CommonAncestor[];
  sireAncestors: Map<string, number>;
  damAncestors: Map<string, number>;
}> {
  // 1. Get sire and dam of the horse
  const { data: directLinks } = await supabase
    .from("pedigree_links")
    .select("parent_id, relation")
    .eq("horse_id", horseId);

  const sireLink = directLinks?.find((l) => l.relation === "sire");
  const damLink = directLinks?.find((l) => l.relation === "dam");

  if (!sireLink || !damLink) {
    return { coefficient: 0, commonAncestors: [], sireAncestors: new Map(), damAncestors: new Map() };
  }

  const sireId = sireLink.parent_id;
  const damId = damLink.parent_id;

  // 2. Walk up sire line
  const sireAncestors = new Map<string, number>();
  let sireFrontier = [{ id: sireId, depth: 1 }];
  while (sireFrontier.length > 0) {
    const next: typeof sireFrontier = [];
    for (const { id, depth } of sireFrontier) {
      if (sireAncestors.has(id) || depth > maxDepth) continue;
      sireAncestors.set(id, depth);

      const { data: links } = await supabase
        .from("pedigree_links")
        .select("parent_id, relation")
        .eq("horse_id", id);

      for (const link of links ?? []) {
        next.push({ id: link.parent_id, depth: depth + 1 });
      }
    }
    sireFrontier = next;
  }

  // 3. Walk up dam line
  const damAncestors = new Map<string, number>();
  let damFrontier = [{ id: damId, depth: 1 }];
  while (damFrontier.length > 0) {
    const next: typeof damFrontier = [];
    for (const { id, depth } of damFrontier) {
      if (damAncestors.has(id) || depth > maxDepth) continue;
      damAncestors.set(id, depth);

      const { data: links } = await supabase
        .from("pedigree_links")
        .select("parent_id, relation")
        .eq("horse_id", id);

      for (const link of links ?? []) {
        next.push({ id: link.parent_id, depth: depth + 1 });
      }
    }
    damFrontier = next;
  }

  // 4. Find common ancestors
  const commonIds = [...sireAncestors.keys()].filter((id) => damAncestors.has(id));

  // 5. Fetch names for common ancestors
  let commonAncestors: CommonAncestor[] = [];
  if (commonIds.length > 0) {
    const { data: ancestorHorses } = await supabase
      .from("horses")
      .select("id, name")
      .in("id", commonIds);

    const nameMap = new Map((ancestorHorses ?? []).map((h) => [h.id, h.name]));

    commonAncestors = commonIds.map((id) => {
      const sireGens = sireAncestors.get(id) ?? 0;
      const damGens = damAncestors.get(id) ?? 0;
      const pathLength = sireGens + damGens;
      // Wright's formula: contribution = (1/2)^(n1+n2+1) * 100
      const contributionPercent = Math.pow(0.5, pathLength + 1) * 100;

      return {
        ancestorId: id,
        ancestorName: nameMap.get(id) ?? "Тодорхойгүй",
        sireGenerations: sireGens,
        damGenerations: damGens,
        pathLength,
        contributionPercent,
      };
    });
  }

  // 6. Sum contributions — if same ancestor appears multiple times through
  // different paths, each path is counted separately. Here each ancestor
  // appears once per generation depth, so we sum directly.
  const coefficient = commonAncestors.reduce((sum, a) => sum + a.contributionPercent, 0);

  return { coefficient, commonAncestors, sireAncestors, damAncestors };
}

// ── Horse picker (horizontal chips) ────────────────────────────────────────
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
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            className={`rounded-full px-4 py-2 ${
              active ? "bg-primary" : "bg-card border border-border"
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

// ── Inbreeding result panel ────────────────────────────────────────────────
function ResultPanel({
  coefficient,
  commonAncestors,
}: {
  coefficient: number;
  commonAncestors: CommonAncestor[];
}) {
  const risk = getRiskLevel(coefficient);

  return (
    <ScrollView className="flex-1" contentContainerClassName="p-4 gap-4">
      {/* Coefficient card */}
      <Card className="p-5 items-center gap-3">
        <Text className="text-sm font-medium text-muted-foreground">
          Урамын коэффициент
        </Text>
        <Text className={`text-4xl font-bold ${risk.color}`}>
          {coefficient.toFixed(2)}%
        </Text>
        <Badge variant={risk.badgeVariant}>{risk.label}</Badge>
      </Card>

      {/* Risk explanation */}
      <Card className="p-4">
        <View className="flex-row items-start gap-3">
          <Ionicons
            name={
              coefficient > 12.5
                ? "alert-circle"
                : coefficient >= 6.25
                  ? "warning"
                  : "checkmark-circle"
            }
            size={20}
            className={risk.color}
          />
          <Text className="flex-1 text-sm text-muted-foreground leading-5">
            {coefficient > 12.5
              ? "Энэ морины удмын нэгдэл өндөр байна. Үржүүлгээс өмнө мэргэжлийн хүнтэй зөвлөлдөх нь зүйтэй."
              : coefficient >= 6.25
                ? "Бага зэрэг удмын нэгдэл ажиглагдаж байна. Анхааралтай хянах хэрэгтэй."
                : "Удмын нэгдэл бага, үржүүлэхэд аюулгүй."}
          </Text>
        </View>
      </Card>

      {/* Common ancestors list */}
      {commonAncestors.length > 0 ? (
        <Card className="p-4">
          <Text className="text-sm font-semibold text-muted-foreground mb-3">
            Нийтлэг өвөг дээдэс
          </Text>
          {commonAncestors
            .sort((a, b) => a.pathLength - b.pathLength)
            .map((a) => (
              <View
                key={a.ancestorId + "-" + a.pathLength}
                className="flex-row items-center justify-between py-2 border-b border-border last:border-b-0"
              >
                <View className="flex-1">
                  <Text className="text-foreground font-medium text-sm">
                    {a.ancestorName}
                  </Text>
                  <Text className="text-muted-foreground text-xs">
                    Аавын талаас {a.sireGenerations}-р үе · Ээжийн талаас {a.damGenerations}-р үе
                  </Text>
                </View>
                <Text className="text-muted-foreground text-xs font-mono">
                  {a.contributionPercent.toFixed(2)}%
                </Text>
              </View>
            ))}
        </Card>
      ) : (
        <Card className="p-5 items-center">
          <Ionicons name="checkmark-circle-outline" size={32} className="text-emerald-500 mb-2" />
          <Text className="text-sm text-muted-foreground text-center">
            Нийтлэг өвөг дээдэс олдсонгүй
          </Text>
        </Card>
      )}
    </ScrollView>
  );
}

// ── Pedigree comparison view (sire vs dam line) ────────────────────────────
function PedigreeComparison({
  sireAncestors,
  damAncestors,
  commonAncestorIds,
}: {
  sireAncestors: Map<string, number>;
  damAncestors: Map<string, number>;
  commonAncestorIds: Set<string>;
}) {
  // Fetch names for top ancestors (limit to avoid too many queries)
  const allIds = useMemo(() => {
    const ids = new Set<string>();
    for (const [id] of sireAncestors) ids.add(id);
    for (const [id] of damAncestors) ids.add(id);
    return [...ids].slice(0, 30); // limit
  }, [sireAncestors, damAncestors]);

  const [names, setNames] = useState<Map<string, string>>(new Map());
  useEffect(() => {
    if (allIds.length === 0) return;
    supabase
      .from("horses")
      .select("id, name")
      .in("id", allIds)
      .then(({ data }) => {
        if (data) {
          setNames(new Map(data.map((h) => [h.id, h.name])));
        }
      });
  }, [allIds]);

  const sireList = useMemo(() => {
    return [...sireAncestors.entries()]
      .sort((a, b) => a[1] - b[1])
      .slice(0, 10);
  }, [sireAncestors]);

  const damList = useMemo(() => {
    return [...damAncestors.entries()]
      .sort((a, b) => a[1] - b[1])
      .slice(0, 10);
  }, [damAncestors]);

  if (sireList.length === 0 && damList.length === 0) return null;

  return (
    <Card className="p-4">
      <Text className="text-sm font-semibold text-muted-foreground mb-3">
        Удам судлалын харьцуулалт
      </Text>
      <View className="flex-row gap-3">
        {/* Sire column */}
        <View className="flex-1">
          <Text className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
            Аавын удам
          </Text>
          {sireList.map(([id, depth]) => {
            const isCommon = commonAncestorIds.has(id);
            return (
              <View
                key={`sire-${id}`}
                className={`py-1.5 px-2 rounded mb-1 ${
                  isCommon ? "bg-amber-500/10" : ""
                }`}
              >
                <Text className={`text-xs font-medium ${isCommon ? "text-amber-500" : "text-foreground"}`}>
                  {names.get(id) ?? "…"}
                </Text>
                <Text className="text-[10px] text-muted-foreground">{depth}-р үе</Text>
              </View>
            );
          })}
        </View>

        {/* Separator */}
        <View className="w-px bg-border" />

        {/* Dam column */}
        <View className="flex-1">
          <Text className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
            Ээжийн удам
          </Text>
          {damList.map(([id, depth]) => {
            const isCommon = commonAncestorIds.has(id);
            return (
              <View
                key={`dam-${id}`}
                className={`py-1.5 px-2 rounded mb-1 ${
                  isCommon ? "bg-amber-500/10" : ""
                }`}
              >
                <Text className={`text-xs font-medium ${isCommon ? "text-amber-500" : "text-foreground"}`}>
                  {names.get(id) ?? "…"}
                </Text>
                <Text className="text-[10px] text-muted-foreground">{depth}-р үе</Text>
              </View>
            );
          })}
        </View>
      </View>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Main screen
// ═══════════════════════════════════════════════════════════════════════════
export default function InbreedingScreen() {
  const { user, loading: authLoading } = useAuth();
  const { data: horses, isPending: horsesPending } = useHorses(user?.id);
  const [selectedId, setSelectedId] = useState<string | undefined>();

  // Calculation state
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    coefficient: number;
    commonAncestors: CommonAncestor[];
    sireAncestors: Map<string, number>;
    damAncestors: Map<string, number>;
  } | null>(null);

  const selectedHorse = horses?.find((h) => h.id === selectedId);

  const handleCalculate = async () => {
    if (!selectedId) return;
    setCalculating(true);
    setError(null);
    setResult(null);
    try {
      const res = await calculateInbreeding(selectedId, 5);
      setResult(res);
    } catch (err) {
      console.error("Inbreeding calculation error:", err);
      setError("Тооцоо хийхэд алдаа гарлаа");
    } finally {
      setCalculating(false);
    }
  };

  // Loading state
  if (authLoading || horsesPending) {
    return (
      <View className="flex-1 bg-background">
        <PageHeader title="Урам шалгах тооцоо" showBack />
        <LoadingState text="Морь ачаалж байна..." />
      </View>
    );
  }

  const noHorses = !horses || horses.length === 0;

  return (
    <View className="flex-1 bg-background">
      <PageHeader
        title="Урам шалгах тооцоо"
        subtitle="Удмын нэгдлийн тооцоо"
        showBack
      />

      {/* Horse picker */}
      {!noHorses && (
        <HorsePicker
          horses={horses}
          selectedId={selectedId}
          onSelect={(id) => {
            setSelectedId(id);
            setResult(null);
            setError(null);
          }}
        />
      )}

      {/* Content */}
      {noHorses ? (
        <EmptyState
          icon="paw-outline"
          title="Морь байхгүй байна"
          subtitle="Урам шалгах тооцоо үзэхийн тулд эхлээд морь нэмнэ үү"
        />
      ) : !selectedId ? (
        <EmptyState
          icon="calculator-outline"
          title="Морь сонгоно уу"
          subtitle="Дээрх жагсаалтаас морь сонгоод тооцоог харна уу"
        />
      ) : (
        <ScrollView className="flex-1" contentContainerClassName="p-4 gap-4">
          {/* Calculate button */}
          {!result && !calculating && (
            <Card className="p-5 items-center gap-4">
              <Ionicons name="calculator-outline" size={48} className="text-muted-foreground" />
              <Text className="text-sm text-muted-foreground text-center">
                "{selectedHorse?.name}" морины удмын нэгдлийг тооцно уу
              </Text>
              <View className="gap-2">
                <Text className="text-xs text-muted-foreground text-center">
                  Wright-ийн бодолтоор хоёр удмын шугамын нийтлэг өвөгийг олж тооцно
                </Text>
              </View>
              <View className="bg-primary/10 rounded-lg p-3 w-full">
                <Text className="text-xs text-primary text-center font-medium">
                  Аавын болон ээжийн удмын модыг татаж, нийтлэг өвөг дээдсийг тооцно
                </Text>
              </View>
            </Card>
          )}

          {/* Loading spinner */}
          {calculating && (
            <Card className="p-8 items-center gap-3">
              <Ionicons name="hourglass-outline" size={32} className="text-primary animate-pulse" />
              <Text className="text-sm text-muted-foreground">
                Тооцоо хийж байна...
              </Text>
            </Card>
          )}

          {/* Error */}
          {error && (
            <Card className="p-5 items-center gap-2">
              <Ionicons name="alert-circle" size={32} className="text-red-500" />
              <Text className="text-sm text-red-500">{error}</Text>
            </Card>
          )}

          {/* Results */}
          {result && !calculating && (
            <>
              <ResultPanel
                coefficient={result.coefficient}
                commonAncestors={result.commonAncestors}
              />
              <PedigreeComparison
                sireAncestors={result.sireAncestors}
                damAncestors={result.damAncestors}
                commonAncestorIds={
                  new Set(result.commonAncestors.map((a) => a.ancestorId))
                }
              />
              {/* Recalculate button */}
              <TouchableOpacity
                onPress={handleCalculate}
                className="bg-card border border-border rounded-lg p-3 items-center"
              >
                <Text className="text-sm font-medium text-foreground">
                  Дахин тооцох
                </Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}
