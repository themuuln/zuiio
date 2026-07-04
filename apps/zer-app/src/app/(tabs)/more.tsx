import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/lib/auth-context";
import { Spacing } from "@/constants/theme";

const menuItems = [
  { icon: "📋", label: "Харилцагчид" },
  { icon: "📥", label: "Худалдан авалт" },
  { icon: "📄", label: "Үнийн санал" },
  { icon: "📊", label: "Тайлан" },
  { icon: "💰", label: "Зарлага" },
  { icon: "🏗️", label: "Агуулах" },
  { icon: "👥", label: "Ажилчид" },
  { icon: "⚙️", label: "Тохиргоо" },
];

export default function MoreScreen() {
  const { signOut } = useAuth();

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <View style={styles.content}>
        <View style={styles.grid}>
          {menuItems.map((item) => (
            <Pressable key={item.label} style={styles.menuCard}>
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={styles.menuLabel}>{item.label}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable onPress={signOut} style={styles.signOut}>
          <Text style={styles.signOutText}>Гарах</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: Spacing.four, gap: Spacing.four },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
  },
  menuCard: {
    width: "30%",
    backgroundColor: "#f8f9ff",
    padding: Spacing.three,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eee",
    alignItems: "center",
    gap: Spacing.one,
  },
  menuIcon: { fontSize: 24 },
  menuLabel: { fontSize: 11, color: "#555", textAlign: "center" },
  signOut: {
    marginTop: Spacing.four,
    padding: Spacing.two,
    alignItems: "center",
  },
  signOutText: { color: "#e53e3e", fontSize: 14 },
});
