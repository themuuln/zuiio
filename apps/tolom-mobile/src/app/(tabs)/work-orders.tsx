import { View, Text, StyleSheet } from "react-native";

export default function WorkOrdersScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Work Orders</Text>
      <Text style={styles.placeholder}>Coming soon</Text>
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
  placeholder: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
  },
});
