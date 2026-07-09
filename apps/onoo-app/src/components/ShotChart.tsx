import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useState } from "react";

interface ShotChartProps {
  onShot: (x: number, y: number, made: boolean) => void;
  disabled?: boolean;
}

// Court dimensions (simplified half-court)
const COURT_WIDTH = 300;
const COURT_HEIGHT = 280;
const BASKET_X = COURT_WIDTH / 2;
const BASKET_Y = 40;

// Three-point line points (simplified)
const THREE_PT_POINTS = [
  { x: 30, y: 280 },
  { x: 30, y: 100 },
  { x: 60, y: 50 },
  { x: COURT_WIDTH / 2, y: 30 },
  { x: COURT_WIDTH - 60, y: 50 },
  { x: COURT_WIDTH - 30, y: 100 },
  { x: COURT_WIDTH - 30, y: 280 },
];

function isInsideThreePoint(x: number, y: number): boolean {
  // Simplified check - if y < 100 and x between 60 and 240, it's inside
  if (y < 100 && x > 60 && x < COURT_WIDTH - 60) {
    return true;
  }
  // Check distance from basket for arc
  const dist = Math.sqrt(
    Math.pow(x - BASKET_X, 2) + Math.pow(y - BASKET_Y, 2)
  );
  return dist < 120; // Simplified three-point distance
}

export function ShotChart({ onShot, disabled = false }: ShotChartProps) {
  const [lastShot, setLastShot] = useState<{ x: number; y: number; made: boolean } | null>(null);

  const handlePress = (x: number, y: number) => {
    if (disabled) return;

    const made = !isInsideThreePoint(x, y); // Simplified: inside = 2pt, outside = 3pt
    // In reality, you'd prompt the user if it was made or missed
    // For now, we'll assume made for demo purposes
    setLastShot({ x, y, made: true });
    onShot(x, y, true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Буудалтын зураг</Text>

      {/* Court */}
      <View style={styles.court}>
        {/* Basket */}
        <View
          style={[
            styles.basket,
            {
              left: BASKET_X - 10,
              top: BASKET_Y - 10,
            },
          ]}
        />

        {/* Three-point line (simplified) */}
        <View style={styles.threePointLine} />

        {/* Paint area */}
        <View style={styles.paint} />

        {/* Last shot marker */}
        {lastShot && (
          <View
            style={[
              styles.shotMarker,
              {
                left: lastShot.x - 8,
                top: lastShot.y - 8,
                backgroundColor: lastShot.made ? "#22c55e" : "#ef4444",
              },
            ]}
          >
            <Text style={styles.shotText}>{lastShot.made ? "✓" : "✗"}</Text>
          </View>
        )}

        {/* Touch zones (invisible buttons) */}
        {[...Array(10)].map((_, row) =>
          [...Array(10)].map((_, col) => (
            <TouchableOpacity
              key={`${row}-${col}`}
              style={[
                styles.touchZone,
                {
                  left: col * (COURT_WIDTH / 10),
                  top: row * (COURT_HEIGHT / 10),
                  width: COURT_WIDTH / 10,
                  height: COURT_HEIGHT / 10,
                },
              ]}
              onPress={() =>
                handlePress(
                  col * (COURT_WIDTH / 10) + COURT_WIDTH / 20,
                  row * (COURT_HEIGHT / 10) + COURT_HEIGHT / 20
                )
              }
              disabled={disabled}
            />
          ))
        )}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#22c55e" }]} />
          <Text style={styles.legendText">Орсон</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#ef4444" }]} />
          <Text style={styles.legendText}>Алдсан</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  court: {
    width: COURT_WIDTH,
    height: COURT_HEIGHT,
    borderWidth: 2,
    borderColor: "#374151",
    borderRadius: 8,
    backgroundColor: "#1f2937",
    position: "relative",
    overflow: "hidden",
  },
  basket: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#f97316",
    position: "absolute",
  },
  threePointLine: {
    position: "absolute",
    left: 60,
    top: 50,
    right: 60,
    bottom: 0,
    borderWidth: 2,
    borderColor: "#374151",
    borderBottomWidth: 0,
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
  },
  paint: {
    position: "absolute",
    left: 90,
    top: 0,
    right: 90,
    bottom: 120,
    borderWidth: 2,
    borderColor: "#374151",
  },
  shotMarker: {
    position: "absolute",
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  shotText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  touchZone: {
    position: "absolute",
    opacity: 0,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 12,
    gap: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: "#6b7280",
  },
});
