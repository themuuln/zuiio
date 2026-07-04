import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/lib/auth-context";
import { Spacing } from "@/constants/theme";

export default function DashboardScreen() {
  const { signOut } = useAuth();

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Сайн уу,</Text>
          <Text style={styles.title}>Zer ERP</Text>
        </View>

        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>0</Text>
            <Text style={styles.kpiLabel}>Өнөөдрийн борлуулалт</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>0</Text>
            <Text style={styles.kpiLabel}>Барааны тоо</Text>
          </View>
        </View>
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>0</Text>
            <Text style={styles.kpiLabel}>Харилцагчид</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiValue}>0</Text>
            <Text style={styles.kpiLabel}>Нийлүүлэгчид</Text>
          </View>
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Түргэн үйлдэл</Text>
          <View style={styles.actionRow}>
            <Pressable style={styles.actionCard}>
              <Text style={styles.actionIcon}>➕</Text>
              <Text style={styles.actionLabel}>Шинэ борлуулалт</Text>
            </Pressable>
            <Pressable style={styles.actionCard}>
              <Text style={styles.actionIcon}>📋</Text>
              <Text style={styles.actionLabel}>Бараа хайх</Text>
            </Pressable>
          </View>
          <View style={styles.actionRow}>
            <Pressable style={styles.actionCard}>
              <Text style={styles.actionIcon}>📸</Text>
              <Text style={styles.actionLabel}>Бар код унших</Text>
            </Pressable>
            <Pressable style={styles.actionCard}>
              <Text style={styles.actionIcon}>📊</Text>
              <Text style={styles.actionLabel}>Тайлан</Text>
            </Pressable>
          </View>
        </View>

        <Pressable onPress={signOut} style={styles.signOut}>
          <Text style={styles.signOutText}>Гарах</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: Spacing.four, gap: Spacing.four },
  header: { marginBottom: Spacing.one },
  greeting: { fontSize: 14, color: "#888" },
  title: { fontSize: 24, fontWeight: "700", color: "#1a1a2e" },
  kpiRow: { flexDirection: "row", gap: Spacing.two },
  kpiCard: {
    flex: 1,
    backgroundColor: "#f8f9ff",
    padding: Spacing.three,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eee",
  },
  kpiValue: { fontSize: 28, fontWeight: "700", color: "#4f46e5" },
  kpiLabel: { fontSize: 12, color: "#888", marginTop: Spacing.half },
  quickActions: { gap: Spacing.two },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: "#333" },
  actionRow: { flexDirection: "row", gap: Spacing.two },
  actionCard: {
    flex: 1,
    backgroundColor: "#fff",
    padding: Spacing.three,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eee",
    alignItems: "center",
    gap: Spacing.one,
  },
  actionIcon: { fontSize: 24 },
  actionLabel: { fontSize: 12, color: "#555" },
  signOut: {
    marginTop: Spacing.four,
    padding: Spacing.two,
    alignItems: "center",
  },
  signOutText: { color: "#e53e3e", fontSize: 14 },
});
