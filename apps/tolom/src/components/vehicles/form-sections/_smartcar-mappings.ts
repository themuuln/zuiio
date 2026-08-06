// ── Mongolian → English mappings for SmartCar API ────────────

export const MN_COLORS: Record<string, string> = {
  хар: "Black",
  цагаан: "White",
  улаан: "Red",
  цэнхэр: "Blue",
  шар: "Yellow",
  ногоон: "Green",
  саарал: "Gray",
  мөнгөн: "Silver",
  бор: "Brown",
  улбар: "Orange",
  ягаан: "Purple",
  алтан: "Gold",
  хүрэн: "Brown",
};

export const MN_FUEL: Record<string, string> = {
  бензин: "Gasoline",
  дизель: "Diesel",
  цахилгаан: "Electric",
  эрлийз: "Hybrid",
  хийн: "LPG",
  автомахин: "Gasoline",
};

export const MN_TRANSMISSION: Record<string, string> = {
  автомат: "Automatic",
  механик: "Manual",
  вариатор: "CVT",
};

export function mapMongolianValue(
  val: string,
  mapping: Record<string, string>,
): string | null {
  const lower = val.toLowerCase().trim();
  for (const [mn, en] of Object.entries(mapping)) {
    if (lower.includes(mn)) return en;
  }
  return null;
}
