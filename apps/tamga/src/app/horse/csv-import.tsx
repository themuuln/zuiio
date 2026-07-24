import { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import Papa from "papaparse";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";

type HorseField = "name" | "breed" | "gender" | "coat" | "birth_year";

const FIELD_LABELS: Record<HorseField, string> = {
  name: "Нэр",
  breed: "Үүлдэр",
  gender: "Хүйс",
  coat: "Өнгө",
  birth_year: "Төрсөн он",
};

const GENDER_MAP: Record<string, string> = {
  эр: "stallion",
  эм: "mare",
  буурал: "gelding",
  stallion: "stallion",
  mare: "mare",
  gelding: "gelding",
};

const COAT_MAP: Record<string, string> = {
  хүрэн: "roan",
  шар: "bay",
  хар: "black",
  улаан: "chestnut",
  цагаан: "grey",
  roan: "roan",
  bay: "bay",
  black: "black",
  chestnut: "chestnut",
  grey: "grey",
};

const REQUIRED_FIELDS: HorseField[] = ["name"];


interface ImportResult {
  success: number;
  errors: number;
}

export default function CsvImportScreen() {
  const router = useRouter();

  const [csvData, setCsvData] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<HorseField, string>>({
    name: "",
    breed: "",
    gender: "",
    coat: "",
    birth_year: "",
  });
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);

  const pickFile = useCallback(async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: "text/csv",
        copyToCacheDirectory: true,
      });

      if (res.canceled || !res.assets?.[0]) return;

      const file = res.assets[0];
      const text = await fetch(file.uri).then((r) => r.text());
      const parsed = Papa.parse<string[]>(text, { skipEmptyLines: true });

      if (parsed.data.length === 0) {
        Alert.alert("Алдаа", "Файл хоосон байна");
        return;
      }

      const rawHeaders = parsed.data[0];
      const rows = parsed.data.slice(1);

      setHeaders(rawHeaders);
      setCsvData(rows);

      // Auto-map by header name similarity
      const auto: Record<HorseField, string> = {
        name: "",
        breed: "",
        gender: "",
        coat: "",
        birth_year: "",
      };
      const fields: HorseField[] = ["name", "breed", "gender", "coat", "birth_year"];
      for (const f of fields) {
        const match = rawHeaders.find(
          (h) =>
            h.toLowerCase().includes(f) ||
            h.toLowerCase().includes(FIELD_LABELS[f].toLowerCase()),
        );
        if (match) auto[f] = match;
      }
      setMapping(auto);
      setResult(null);
    } catch {
      Alert.alert("Алдаа", "Файл уншихад алдаа гарлаа");
    }
  }, []);

  const mappedFields = (Object.keys(mapping) as HorseField[]).filter(
    (f) => mapping[f],
  );

  const hasRequiredFields = REQUIRED_FIELDS.every((f) => mapping[f]);

  async function handleImport() {
    if (!hasRequiredFields || csvData.length === 0) return;

    setImporting(true);
    setProgress(0);
    setResult(null);

    let success = 0;
    let errors = 0;
    const total = csvData.length;

    for (let i = 0; i < total; i++) {
      const row = csvData[i];
      const headersIdx = headers;

      const record: Record<string, unknown> = {};

      for (const field of mappedFields) {
        const csvCol = mapping[field];
        const colIdx = headersIdx.indexOf(csvCol);
        if (colIdx === -1) continue;

        let val = row[colIdx]?.trim() ?? "";

        if (field === "gender") {
          val = GENDER_MAP[val.toLowerCase()] ?? val;
        } else if (field === "coat") {
          val = COAT_MAP[val.toLowerCase()] ?? val;
        } else if (field === "birth_year") {
          const yr = parseInt(val, 10);
          record[field] = isNaN(yr) ? null : yr;
          continue;
        }

        record[field] = val || null;
      }

      // Skip rows with no name
      if (!record.name) {
        errors++;
        setProgress(Math.round(((i + 1) / total) * 100));
        continue;
      }

      try {
        const { error } = await supabase.from("horses").insert(record);
        if (error) {
          errors++;
        } else {
          success++;
        }
      } catch {
        errors++;
      }

      setProgress(Math.round(((i + 1) / total) * 100));
    }

    setResult({ success, errors });
    setImporting(false);
  }

  const previewRows = csvData.slice(0, 10);

  return (
    <View className="flex-1 bg-background">
      <PageHeader
        title="CSV импорт"
        subtitle={`${csvData.length > 0 ? `${csvData.length} мөр` : "Файл сонгоно уу"}`}
        showBack
      />

      <ScrollView className="flex-1 px-4">
        {/* File picker */}
        <TouchableOpacity
          onPress={pickFile}
          disabled={importing}
          className="flex-row items-center justify-center gap-3 bg-card border border-border rounded-xl p-6 mb-4"
        >
          <Ionicons name="document-text-outline" size={32} className="text-primary" />
          <View>
            <Text className="text-foreground font-semibold text-base">
              Файл сонгох
            </Text>
            <Text className="text-muted-foreground text-sm">CSV файл</Text>
          </View>
        </TouchableOpacity>

        {csvData.length === 0 && !result && (
          <View className="items-center py-16">
            <Ionicons name="cloud-upload-outline" size={64} className="text-muted-foreground" />
            <Text className="text-muted-foreground mt-4 text-center">
              CSV файл сонгон урьдчилсан үзүүлэх болон импортлоно уу
            </Text>
          </View>
        )}

        {/* Column mapping */}
        {headers.length > 0 && (
          <Card className="p-4 mb-4">
            <Text className="text-foreground font-semibold mb-3">
              Багана тохируулах
            </Text>
            {(Object.keys(mapping) as HorseField[]).map((field) => (
              <View key={field} className="mb-3">
                <Text className="text-sm text-muted-foreground mb-1">
                  {FIELD_LABELS[field]}
                  {REQUIRED_FIELDS.includes(field) && (
                    <Text className="text-destructive"> *</Text>
                  )}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={() =>
                        setMapping((prev) => ({ ...prev, [field]: "" }))
                      }
                      className={`px-3 py-1.5 rounded-lg border ${
                        !mapping[field]
                          ? "bg-primary/10 border-primary"
                          : "bg-card border-border"
                      }`}
                    >
                      <Text
                        className={`text-sm ${
                          !mapping[field]
                            ? "text-primary font-medium"
                            : "text-muted-foreground"
                        }`}
                      >
                        —
                      </Text>
                    </TouchableOpacity>
                    {headers.map((h) => (
                      <TouchableOpacity
                        key={h}
                        onPress={() =>
                          setMapping((prev) => ({ ...prev, [field]: h }))
                        }
                        className={`px-3 py-1.5 rounded-lg border ${
                          mapping[field] === h
                            ? "bg-primary/10 border-primary"
                            : "bg-card border-border"
                        }`}
                      >
                        <Text
                          className={`text-sm ${
                            mapping[field] === h
                              ? "text-primary font-medium"
                              : "text-foreground"
                          }`}
                        >
                          {h}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            ))}
          </Card>
        )}

        {/* Preview table */}
        {previewRows.length > 0 && (
          <Card className="p-4 mb-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-foreground font-semibold">
                Урьдчилсан үзүүлэх
              </Text>
              <Badge>
                <Text className="text-xs">
                  {csvData.length > 10
                    ? `1 / ${csvData.length}`
                    : `${csvData.length} мөр`}
                </Text>
              </Badge>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View>
                {/* Header */}
                <View className="flex-row border-b border-border pb-2 mb-1">
                  {headers.map((h) => (
                    <Text
                      key={h}
                      className="text-xs font-semibold text-muted-foreground w-24 shrink-0"
                      numberOfLines={1}
                    >
                      {h}
                    </Text>
                  ))}
                </View>

                {/* Rows */}
                {previewRows.map((row, i) => (
                  <View
                    key={i}
                    className="flex-row py-1.5 border-b border-border/50"
                  >
                    {row.map((cell, j) => (
                      <Text
                        key={j}
                        className="text-sm text-foreground w-24 shrink-0"
                        numberOfLines={1}
                      >
                        {cell ?? ""}
                      </Text>
                    ))}
                  </View>
                ))}
              </View>
            </ScrollView>
          </Card>
        )}

        {/* Progress */}
        {importing && (
          <Card className="p-4 mb-4">
            <View className="flex-row items-center gap-3 mb-3">
              <ActivityIndicator size="small" className="text-primary" />
              <Text className="text-foreground font-medium">
                Импортлож байна...
              </Text>
            </View>
            <Progress value={progress} />
            <Text className="text-muted-foreground text-xs mt-2">
              {progress}% — {Math.round((progress / 100) * csvData.length)}/
              {csvData.length}
            </Text>
          </Card>
        )}

        {/* Result */}
        {result && (
          <Card className="p-4 mb-4">
            <View className="flex-row items-center gap-3 mb-2">
              <Ionicons
                name={result.errors === 0 ? "checkmark-circle" : "alert-circle"}
                size={24}
                className={
                  result.errors === 0 ? "text-green-500" : "text-yellow-500"
                }
              />
              <Text className="text-foreground font-semibold text-base">
                Импорт дууссан
              </Text>
            </View>
            <Text className="text-foreground">
              {result.success} морь амжилттай нэмэгдлээ
              {result.errors > 0 && `, ${result.errors} алдаатай`}
            </Text>
            {result.errors > 0 && (
              <Text className="text-muted-foreground text-sm mt-1">
                Нэр бүхий мөрүүдийг нэмсэн
              </Text>
            )}
          </Card>
        )}
      </ScrollView>

      {/* Import button */}
      {csvData.length > 0 && !importing && !result && (
        <View className="px-4 pb-8 pt-2">
          <TouchableOpacity
            onPress={handleImport}
            disabled={!hasRequiredFields}
            className={`rounded-xl py-4 items-center ${
              hasRequiredFields ? "bg-primary" : "bg-muted"
            }`}
          >
            <Text
              className={`font-semibold text-base ${
                hasRequiredFields ? "text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              Импортлох ({csvData.length} мөр)
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* After import: back button */}
      {result && (
        <View className="px-4 pb-8 pt-2">
          <TouchableOpacity
            onPress={() => router.back()}
            className="rounded-xl py-4 items-center bg-primary"
          >
            <Text className="text-primary-foreground font-semibold text-base">
              Буцах
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
