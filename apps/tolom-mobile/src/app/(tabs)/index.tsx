import { View, Text, StyleSheet } from "react-native";
import { useAuth } from "@zuiio/auth";

export default function HomeScreen() {
  const { state } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tolom</Text>
      <Text style={styles.status}>
        {state.status === "loading" && "Loading..."}
        {state.status === "authenticated" && "Signed in"}
        {state.status === "unauthenticated" && "Not signed in"}
      </Text>
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
    fontSize: 32,
    fontWeight: "bold",
    color: "#000",
  },
  status: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
  },
});
