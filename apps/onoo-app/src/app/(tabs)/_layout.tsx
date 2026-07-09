import { Tabs } from "expo-router";
import { Text } from "react-native";

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: "Нүүр",
          tabBarIcon: ({ color }) => <Text style={{ color }}>🏠</Text>,
        }}
      />
      <Tabs.Screen
        name="games"
        options={{
          title: "Тоглолт",
          tabBarIcon: ({ color }) => <Text style={{ color }}>🏀</Text>,
        }}
      />
      <Tabs.Screen
        name="standings"
        options={{
          title: "Шалгуур",
          tabBarIcon: ({ color }) => <Text style={{ color }}>📊</Text>,
        }}
      />
      <Tabs.Screen
        name="leaders"
        options={{
          title: "Шилдэг",
          tabBarIcon: ({ color }) => <Text style={{ color }}>⭐</Text>,
        }}
      />
      <Tabs.Screen
        name="follows"
        options={{
          title: "Дагасан",
          tabBarIcon: ({ color }) => <Text style={{ color }}>❤️</Text>,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Профайл",
          tabBarIcon: ({ color }) => <Text style={{ color }}>👤</Text>,
        }}
      />
    </Tabs>
  );
}
