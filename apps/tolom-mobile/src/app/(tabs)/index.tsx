import { View, Text, StyleSheet } from "react-native";
import { useAuth } from "@zuiio/auth";

export default function HomeScreen() {
  const { state } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tolom</Text>
      {state.status === "authenticated" && (
        <Text style={styles.subtitle}>Welcome back!</Text>
      )}
      {state.status === "unauthenticated" && (
        <Text style={styles.subtitle}>Please sign in</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#7C3AED",
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 8,
  },
});
