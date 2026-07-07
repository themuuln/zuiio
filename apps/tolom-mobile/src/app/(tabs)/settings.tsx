import { View, Text, StyleSheet } from "react-native";
import { useAuth } from "@zuiio/auth";

export default function SettingsScreen() {
  const { state, actions } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      {state.status === "authenticated" && (
        <Text style={styles.info}>Signed in</Text>
      )}
      {state.status === "unauthenticated" && (
        <Text style={styles.info}>Not signed in</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
  },
  info: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
  },
});
