import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Alert,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { InfoRow } from "@/components/ui/InfoRow";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Separator } from "@/components/ui/Separator";
import { Loading } from "@/components/ui/Loading";
import { ErrorState } from "@/components/states";

interface ContractListing {
  id: string;
  seller_id: string;
  horse_id: string;
  listing_type: string;
  price_mnt: number | null;
  description: string | null;
  location: string | null;
  created_at: string;
  horses?: { name: string; breed: string | null } | null;
}

interface Profile {
  display_name: string;
}

export default function ContractScreen() {
  const { listing_id, buyer_id } = useLocalSearchParams<{
    listing_id: string;
    buyer_id: string;
  }>();
  const { user } = useAuth();
  const [terms, setTerms] = useState("");
  const [creating, setCreating] = useState(false);

  const { data: listing, isPending, error, refetch } = useQuery({
    queryKey: ["contract-listing", listing_id],
    queryFn: async () => {
      if (!listing_id) return null;
      const { data, error } = await supabase
        .from("listings")
        .select("*, horses(name, breed)")
        .eq("id", listing_id)
        .single();
      if (error) throw error;
      return data as ContractListing;
    },
    enabled: !!listing_id,
  });

  const { data: sellerProfile } = useQuery({
    queryKey: ["contract-seller", listing?.seller_id],
    queryFn: async () => {
      if (!listing?.seller_id) return null;
      const { data } = await supabase
        .from("seller_profiles")
        .select("display_name")
        .eq("user_id", listing.seller_id)
        .single();
      return data as Profile | null;
    },
    enabled: !!listing?.seller_id,
  });

  const { data: buyerProfile } = useQuery({
    queryKey: ["contract-buyer", buyer_id],
    queryFn: async () => {
      if (!buyer_id) return null;
      const { data } = await supabase
        .from("seller_profiles")
        .select("display_name")
        .eq("user_id", buyer_id)
        .single();
      return data as Profile | null;
    },
    enabled: !!buyer_id,
  });

  const sellerName = sellerProfile?.display_name ?? "Борлуулагч";
  const buyerName = buyerProfile?.display_name ?? "Худалдан авагч";
  const horseName = listing?.horses?.name ?? "—";
  const horseBreed = listing?.horses?.breed ?? "—";
  const price = listing?.price_mnt?.toLocaleString("mn-MN") ?? "—";
  const today = new Date().toLocaleDateString("mn-MN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const defaultTerms =
    "1. Нийлүүлэгч нь дурдсан морийг худалдахыг зөвшөөрч, худалдан авагч нь дурдсан үнээр худалдан авахыг зөвшөөрч байна.\n\n" +
    "2. Төлбөр нь гэрээнд гарын үсэг зурсны дараа 7 хоногийн дотор бүрэн төлөгдөнө.\n\n" +
    "3. Морийг шилжүүлэх нь төлбөр бүрэн төлөгдсөний дараа хийгдэнэ.\n\n" +
    "4. Гэрээ цуцлагдсан тохиолдолд төлбөрийг буцаан олгоно.";

  function handleCreate() {
    Alert.alert(
      "Гэрээ үүсгэх",
      "Гэрээг үүсгэх үйлдэл удахгүй нэмэгдэнэ.",
      [{ text: "Ойлголоо" }]
    );
  }

  function handleDownload() {
    Alert.alert(
      "Татаж авах",
      "PDF татаж авах функц удахгүй нэмэгдэнэ.",
      [{ text: "Ойлголоо" }]
    );
  }

  if (isPending) return <Loading />;
  if (error || !listing)
    return (
      <ErrorState
        message="Гэрээний мэдээлэл олдсонгүй"
        onRetry={refetch}
      />
    );

  return (
    <View className="flex-1 bg-background">
      <PageHeader title="Худалдааны гэрээ" showBack />

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pb-24"
        showsVerticalScrollIndicator={false}
      >
        {/* Contract header */}
        <View className="items-center mb-6 mt-2">
          <Ionicons
            name="document-text-outline"
            size={48}
            className="text-primary"
          />
          <Text className="text-foreground font-bold text-xl mt-3">
            Худалдааны гэрээ
          </Text>
          <Text className="text-muted-foreground text-sm mt-1">
            {today}
          </Text>
        </View>

        {/* Parties */}
        <Card className="mb-4">
          <Text className="text-foreground font-semibold mb-3 text-base">
            Талууд
          </Text>
          <InfoRow label="Борлуулагч" value={sellerName} />
          <InfoRow label="Худалдан авагч" value={buyerName} />
          <View className="mt-3 flex-row items-center gap-2">
            <Ionicons
              name="checkmark-circle-outline"
              size={14}
              className="text-muted-foreground"
            />
            <Text className="text-muted-foreground text-xs">
              Давуу эрх: {user?.id === listing.seller_id ? sellerName : buyerName}
            </Text>
          </View>
        </Card>

        {/* Horse details */}
        <Card className="mb-4">
          <Text className="text-foreground font-semibold mb-3 text-base">
            Морины мэдээлэл
          </Text>
          <InfoRow label="Нэр" value={horseName} />
          <InfoRow label="Үүлдэр" value={horseBreed} />
          <InfoRow
            label="Худалдааны төрөл"
            value={
              listing.listing_type === "sale"
                ? "Зарах"
                : listing.listing_type === "lease"
                  ? "Хөлслөх"
                  : "Үржүүлэх"
            }
          />
          <InfoRow label="Үнэ" value={`${price}₮`} />
          {listing.location && (
            <InfoRow label="Байршил" value={listing.location} />
          )}
        </Card>

        {/* Terms */}
        <Card className="mb-4">
          <Text className="text-foreground font-semibold mb-3 text-base">
            Нөхцөлүүд
          </Text>
          <Separator className="mb-3" />
          <Textarea
            label="Гэрээний нөхцөл"
            value={terms || defaultTerms}
            onChangeText={setTerms}
            placeholder="Гэрээний нөхцөлийг бичнэ үү..."
          />
        </Card>

        {/* Signatures */}
        <Card className="mb-4">
          <Text className="text-foreground font-semibold mb-3 text-base">
            Гарын үсэг
          </Text>
          <Separator className="mb-4" />

          <View className="flex-row justify-between">
            <View className="flex-1 mr-4">
              <Text className="text-muted-foreground text-xs mb-1">
                Борлуулагч
              </Text>
              <View className="border border-border rounded-xl p-4 items-center min-h-[60px] justify-center">
                <Text className="text-muted-foreground text-sm italic">
                  {sellerName}
                </Text>
                <Text className="text-muted-foreground text-xs mt-1">
                  {today}
                </Text>
              </View>
            </View>

            <View className="flex-1 ml-4">
              <Text className="text-muted-foreground text-xs mb-1">
                Худалдан авагч
              </Text>
              <View className="border border-border rounded-xl p-4 items-center min-h-[60px] justify-center">
                <Text className="text-muted-foreground text-sm italic">
                  {buyerName}
                </Text>
                <Text className="text-muted-foreground text-xs mt-1">
                  {today}
                </Text>
              </View>
            </View>
          </View>
        </Card>
      </ScrollView>

      {/* Action buttons */}
      <View className="px-4 pb-6 pt-2 bg-background border-t border-border">
        <Button
          title="Гэрээ үүсгэх"
          onPress={handleCreate}
          loading={creating}
          className="mb-3"
        />
        <Button
          title="Татаж авах"
          variant="secondary"
          onPress={handleDownload}
        />
      </View>
    </View>
  );
}
