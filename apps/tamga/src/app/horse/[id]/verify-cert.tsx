import { View, Text, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { InfoRow } from "@/components/ui/InfoRow";
import { PageHeader } from "@/components/ui/PageHeader";
import { LoadingState, ErrorState, EmptyState } from "@/components/states";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CertificateData {
  id: string;
  certificate_type: string | null;
  issued_at: string;
  expiry_date: string | null;
  status: string | null;
  qr_code: string | null;
  horse: {
    name: string;
    breed: string | null;
  } | null;
  owner: {
    display_name: string;
  } | null;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("mn-MN");
  } catch {
    return dateStr;
  }
}

function isCertificateValid(cert: CertificateData): boolean {
  if (cert.status === "revoked") return false;
  if (cert.expiry_date) {
    return new Date(cert.expiry_date) > new Date();
  }
  return true;
}

const CERT_TYPE_LABELS: Record<string, string> = {
  ownership: "Эзэмшлийн",
  health: "Эрүүл мэндийн",
  breed_registry: "Үүлдрийн бүртгэлийн",
  vaccination: "Вакцин",
  identification: "Таних тэмдэг",
};

function getCertTypeLabel(type: string | null): string {
  if (!type) return "Нийт";
  return CERT_TYPE_LABELS[type] ?? type;
}

function getCertTypeBadgeVariant(
  type: string | null,
): "default" | "success" | "warning" | "secondary" {
  switch (type) {
    case "ownership":
      return "default";
    case "health":
      return "success";
    case "breed_registry":
      return "warning";
    default:
      return "secondary";
  }
}

/* ------------------------------------------------------------------ */
/*  Screen                                                             */
/* ------------------------------------------------------------------ */

export default function VerifyCertScreen() {
  const { id: horseId, certificate_id } = useLocalSearchParams<{
    id: string;
    certificate_id: string;
  }>();
  const router = useRouter();

  const {
    data: certificate,
    isPending,
    isError,
    error,
  } = useQuery<CertificateData | null>({
    queryKey: ["verify-certificate", certificate_id],
    queryFn: async () => {
      if (!certificate_id) return null;

      const { data, error: fetchErr } = await supabase
        .from("certificates")
        .select(
          "id, certificate_type, issued_at, expiry_date, status, qr_code, horses(name, breed, owner:profiles!horses_owner_id_fkey(display_name))",
        )
        .eq("id", certificate_id)
        .single();

      if (fetchErr) throw fetchErr;

      // Supabase returns nested joins — normalise
      const row = data as Record<string, unknown>;
      const horses = row.horses as Record<string, unknown> | null;
      const owner = horses?.owner as Record<string, unknown> | null;

      return {
        id: row.id as string,
        certificate_type: (row.certificate_type as string) ?? null,
        issued_at: row.issued_at as string,
        expiry_date: (row.expiry_date as string) ?? null,
        status: (row.status as string) ?? null,
        qr_code: (row.qr_code as string) ?? null,
        horse: horses
          ? { name: horses.name as string, breed: (horses.breed as string) ?? null }
          : null,
        owner: owner
          ? { display_name: owner.display_name as string }
          : null,
      };
    },
    enabled: !!certificate_id,
    staleTime: 1000 * 60 * 5,
  });

  /* ---------- Loading ---------- */
  if (isPending) {
    return (
      <View className="flex-1 bg-background">
        <PageHeader title="Гэрчилгээ шалгах" showBack />
        <LoadingState />
      </View>
    );
  }

  /* ---------- Error ---------- */
  if (isError) {
    return (
      <View className="flex-1 bg-background">
        <PageHeader title="Гэрчилгээ шалгах" showBack />
        <ErrorState
          message={error?.message ?? "Алдаа гарлаа"}
          onRetry={() => router.back()}
        />
      </View>
    );
  }

  /* ---------- Not found ---------- */
  if (!certificate || !certificate_id) {
    return (
      <View className="flex-1 bg-background">
        <PageHeader title="Гэрчилгээ шалгах" showBack />
        <EmptyState
          icon="document-text-outline"
          title="Гэрчилгээ олдсонгүй"
          subtitle="Энэхүү гэрчилгээний дугаар системд бүртгэлгүй байна"
        />
      </View>
    );
  }

  /* ---------- Verification result ---------- */
  const isValid = isCertificateValid(certificate);
  const isExpired =
    !isValid &&
    certificate.expiry_date &&
    new Date(certificate.expiry_date) <= new Date();

  const validIcon = isValid ? "checkmark-circle" : "close-circle";
  const validColor = isValid
    ? "text-emerald-500"
    : "text-destructive";
  const validBg = isValid ? "bg-emerald-500/10" : "bg-destructive/10";
  const validTitle = isValid ? "Хүчинтэй" : "Хүчин төгсгөл болсон";
  const validSubtitle = isValid
    ? "Энэхүү гэрчилгээ баталгаатай байна"
    : isExpired
      ? "Гэрчилгээний хугацаа дууссан"
      : "Гэрчилгээ цуцлагдсан байна";

  return (
    <View className="flex-1 bg-background" accessibilityRole="summary">
      <PageHeader title="Гэрчилгээ шалгах" showBack />

      <ScrollView className="flex-1 px-4">
        {/* Verification Status Banner */}
        <View
          className={`rounded-2xl p-6 mb-6 items-center ${validBg}`}
          accessibilityLabel={`Баталгаажуулалтын төлөв: ${validTitle}`}
        >
          <Ionicons
            name={validIcon}
            size={64}
            className={validColor}
          />
          <Text
            className={`text-xl font-bold mt-3 ${validColor}`}
          >
            {validTitle}
          </Text>
          <Text className="text-muted-foreground mt-1 text-center text-sm">
            {validSubtitle}
          </Text>
        </View>

        {/* Certificate Type Badge */}
        <View className="mb-4 items-center">
          <Badge variant={getCertTypeBadgeVariant(certificate.certificate_type)}>
            {getCertTypeLabel(certificate.certificate_type)}
          </Badge>
        </View>

        {/* Certificate Details */}
        <Card className="mb-4">
          <Text className="text-foreground font-semibold text-base mb-2">
            Гэрчилгээний мэдээлэл
          </Text>
          <InfoRow
            label="Морийн нэр"
            value={certificate.horse?.name ?? "—"}
          />
          <InfoRow
            label="Үүлдэр"
            value={certificate.horse?.breed ?? "—"}
          />
          <InfoRow
            label="Эзэмшигч"
            value={certificate.owner?.display_name ?? "—"}
          />
          <InfoRow
            label="Олгосон огноо"
            value={formatDate(certificate.issued_at)}
          />
          {certificate.expiry_date && (
            <InfoRow
              label="Хугацаа дуусах"
              value={formatDate(certificate.expiry_date)}
            />
          )}
          <InfoRow label="Төлөв" value={certificate.status ?? "Идэвхтэй"} />
        </Card>

        {/* QR Code Placeholder */}
        <Card className="mb-6 items-center">
          <Text className="text-foreground font-semibold text-base mb-3">
            QR код
          </Text>
          <View
            className="w-40 h-40 bg-muted rounded-xl items-center justify-center border border-border"
            accessibilityLabel="QR кодийн зураг"
          >
            <Ionicons
              name="qr-code-outline"
              size={64}
              className="text-muted-foreground"
            />
            <Text className="text-muted-foreground text-xs mt-2">
              QR код
            </Text>
          </View>
        </Card>

        {/* Certificate ID */}
        <Card className="mb-6">
          <InfoRow label="Гэрчилгээний дугаар" value={certificate.id} />
        </Card>
      </ScrollView>
    </View>
  );
}
