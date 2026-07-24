import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useInviteTeamMember } from "@/hooks/useTeamMutations";
import type { TeamRole } from "@/hooks/useTeams";

// ── Role options ─────────────────────────────────────────────────

const ROLE_OPTIONS: { value: TeamRole; label: string; description: string }[] = [
  {
    value: "manager",
    label: "Менежер",
    description: "Баг удирдана, гишүүн нэмж хасана",
  },
  {
    value: "vet",
    label: "Эмч",
    description: "Эрүүл мэндийн мэдээлэл оруулна",
  },
  {
    value: "groom",
    label: "Боорцогч",
    description: "Өдөр тутмын арчилгаа хийнэ",
  },
  {
    value: "viewer",
    label: "Үзэгч",
    description: "Зөвхөн харах эрхтэй",
  },
];

// ── Role Badge ───────────────────────────────────────────────────

function RoleBadge({
  role,
  selected,
  onSelect,
}: {
  role: (typeof ROLE_OPTIONS)[number];
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <TouchableOpacity
      className={`rounded-xl p-4 mb-3 border ${
        selected
          ? "border-primary bg-primary/10"
          : "border-border bg-card"
      }`}
      onPress={onSelect}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text
            className={`font-semibold ${
              selected ? "text-primary" : "text-foreground"
            }`}
          >
            {role.label}
          </Text>
          <Text className="text-muted-foreground text-sm mt-1">
            {role.description}
          </Text>
        </View>
        {selected && (
          <Ionicons name="checkmark-circle" size={24} className="text-primary" />
        )}
      </View>
    </TouchableOpacity>
  );
}

// ── Main Screen ──────────────────────────────────────────────────

export default function InviteMemberScreen() {
  const { teamId } = useLocalSearchParams<{ teamId: string }>();
  const router = useRouter();
  const inviteMember = useInviteTeamMember();

  const [contact, setContact] = useState("");
  const [selectedRole, setSelectedRole] = useState<TeamRole>("viewer");

  const trimmedContact = contact.trim();
  const isValidPhone = /^\+?\d{8,15}$/.test(trimmedContact);
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedContact);
  const canSubmit = (isValidPhone || isValidEmail) && !inviteMember.isPending;

  async function handleSubmit() {
    if (!teamId) return;

    if (!isValidPhone && !isValidEmail) {
      Alert.alert(
        "Алдаа",
        "Зөв утасны дугаар эсвэл и-мэйл хаяг оруулна уу.\n\nЖишээ: +97699112233 эсвэл name@example.com",
      );
      return;
    }

    try {
      await inviteMember.mutateAsync({
        teamId,
        contact: trimmedContact,
        role: selectedRole,
      });
      Alert.alert("Амжилттай", "Урилга илгээгдлээ", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Урилга илгээхэд алдаа гарлаа";
      Alert.alert("Алдаа", message);
    }
  }

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pt-12 pb-4">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} className="text-foreground" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-foreground flex-1 text-center">
          Гишүүн урих
        </Text>
        <View className="w-6" />
      </View>

      <ScrollView className="flex-1 px-4" contentContainerClassName="pb-8">
        {/* Contact Input */}
        <View className="bg-card rounded-2xl p-4 mb-4">
          <Text className="text-sm font-semibold text-muted-foreground mb-3">
            Утас эсвэл и-мэйл
          </Text>
          <TextInput
            className="bg-secondary rounded-lg px-4 py-3 text-foreground"
            placeholder="+97699112233 эсвэл name@example.com"
            placeholderTextColor="rgb(var(--muted-foreground))"
            value={contact}
            onChangeText={setContact}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {trimmedContact.length > 0 && !(isValidPhone || isValidEmail) && (
            <Text className="text-destructive text-xs mt-2">
              Зөв утас эсвэл и-мэйл оруулна уу
            </Text>
          )}
        </View>

        {/* Role Selector */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-muted-foreground mb-3 px-1">
            Эрх сонгох
          </Text>
          {ROLE_OPTIONS.map((role) => (
            <RoleBadge
              key={role.value}
              role={role}
              selected={selectedRole === role.value}
              onSelect={() => setSelectedRole(role.value)}
            />
          ))}
        </View>

        {/* Info Note */}
        <View className="bg-secondary rounded-xl p-4 mb-6 flex-row items-start gap-2">
          <Ionicons name="information-circle-outline" size={20} className="text-muted-foreground mt-0.5" />
          <Text className="text-muted-foreground text-sm flex-1">
            Урилга илгээсний дараа хэрэглэгч хүлээн авч, зөвшөөрсөн тохиолдолд багт нэгднэ.
          </Text>
        </View>

        {/* Submit */}
        <TouchableOpacity
          className={`rounded-xl py-4 items-center ${
            canSubmit ? "bg-primary" : "bg-secondary"
          }`}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          <Text
            className={`font-bold text-lg ${
              canSubmit ? "text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            {inviteMember.isPending ? "Илгээж байна..." : "Урилга илгээх"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}