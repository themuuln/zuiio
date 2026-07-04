import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Spacing } from "@/constants/theme";

export default function SalesScreen() {
  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <View style={styles.content}>
        <Text style={styles.title}>Борлуулалт</Text>
        <Text style={styles.subtitle}>Түргэн борлуулалт хийх</Text>

        <View style={styles.placeholder}>
          <Text style={styles.placeholderIcon}>🛒</Text>
          <Text style={styles.placeholderText}>
            Борлуулалтын түүх энд харагдана
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: Spacing.four, gap: Spacing.three },
  title: { fontSize: 22, fontWeight: "700", color: "#1a1a2e" },
  subtitle: { fontSize: 14, color: "#888" },
  placeholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.three,
    opacity: 0.5,
  },
  placeholderIcon: { fontSize: 48 },
  placeholderText: { fontSize: 14, color: "#888", textAlign: "center" },
});
