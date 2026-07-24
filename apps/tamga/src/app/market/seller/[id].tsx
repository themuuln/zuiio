import { View, Text, FlatList } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSellerProfile, useSellerListings } from "@/hooks/useSellerProfile";
import { PageHeader } from "@/components/ui/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Loading } from "@/components/ui/Loading";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/states";

export default function SellerProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: profile, isPending: loadingProfile, error: profileError } = useSellerProfile(id);
  const { data: listings = [], isPending: loadingListings } = useSellerListings(id);

  if (loadingProfile) return <Loading />;
  if (profileError || !profile) return <ErrorState message="Борлуулагч олдсонгүй" />;

  return (
    <View className="flex-1 bg-background">
      <PageHeader title={profile.display_name} showBack />
      <View className="px-4">
        <Card className="mb-4">
          <View className="flex-row items-center gap-4 mb-3">
            <Avatar name={profile.display_name} size="lg" />
            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text className="text-foreground font-bold text-lg">{profile.display_name}</Text>
                {profile.verified && <Badge variant="success">Баталгаажсан</Badge>}
              </View>
              {profile.bio && <Text className="text-muted-foreground text-sm mt-1">{profile.bio}</Text>}
            </View>
          </View>
          <View className="flex-row gap-6">
            <View className="items-center">
              <Ionicons name="star" size={16} className="text-amber-500" />
              <Text className="text-foreground font-bold">{profile.rating?.toFixed(1) ?? "—"}</Text>
              <Text className="text-muted-foreground text-xs">Үнэлгээ</Text>
            </View>
            <View className="items-center">
              <Ionicons name="bag-check-outline" size={16} className="text-primary" />
              <Text className="text-foreground font-bold">{profile.total_sales ?? 0}</Text>
              <Text className="text-muted-foreground text-xs">Борлуулалт</Text>
            </View>
          </View>
        </Card>

        <Text className="text-foreground font-semibold mb-3">Идэвхитэй зарууд</Text>
      </View>

      {loadingListings ? (
        <Loading />
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item: any) => item.id}
          renderItem={({ item }: any) => (
            <Card className="mx-4 mb-2">
              <Text className="text-foreground font-medium">{item.title}</Text>
              <Text className="text-primary font-bold">{item.price?.toLocaleString()}₮</Text>
            </Card>
          )}
          contentContainerClassName="px-4 pb-20"
          ListEmptyComponent={
            <EmptyState icon="pricetag-outline" title="Зар байхгүй" />
          }
        />
      )}
    </View>
  );
}
