/**
 * Expected storefront order-rejection messages.
 *
 * `submit_shop_order` raises these exceptions for business rules (stock,
 * coupon, gift card, loyalty, validation) and PostgREST surfaces them
 * verbatim as the RPC error `message`. The cart shows them to the buyer —
 * they are control flow, not failures, so Sentry must not receive them.
 *
 * Keep this list in sync with the RAISE EXCEPTION set in
 * `supabase/migrations/20260813020000_storefront_loyalty_hardware.sql`
 * (and its predecessors). Unknown messages still reach Sentry — the
 * failure mode of a stale list is noise, never missed errors.
 */
export const STORE_ORDER_BUSINESS_MESSAGES: readonly string[] = [
  "Дэлгүүр олдсонгүй",
  "Хэт олон захиалга ирсэн байна. Түр хүлээгээд дахин оролдоно уу.",
  "Хүргэлтийн төрөл буруу байна",
  "Хүргэлт ашиглах боломжгүй байна",
  "Хүргэлтийн хаяг оруулна уу",
  "Холбогдох нэр, утасны дугаараа оруулна уу",
  "Дэлгүүрээс авах боломжгүй байна",
  "Салбар олдсонгүй",
  "Дэлгүүр салбар тохируулаагүй байна",
  "Захиалгын мэдээлэл буруу байна",
  "Захиалга хоосон байна",
  "Хэт олон бараа байна",
  "Барааны тоо буруу байна",
  "Барааны тоо хэт их байна",
  "Бүтээгдэхүүн олдсонгүй",
  "Вариант олдсонгүй",
  "Нөөц хүрэлцэхгүй байна",
  "Оноо ашиглахын тулд нэвтрэх шаардлагатай",
  "Лоялти хөтөлбөр идэвхгүй байна",
  "Оноо ашиглахын тулд утасны дугаараа бүртгүүлнэ үү",
  "Оноо хүрэлцэхгүй байна",
  "Купон олдсонгүй",
  "Купон идэвхгүй байна",
  "Купоны хүчинтэй хугацаа дууссан",
  "Купоны ашиглалтын хязгаар хүрсэн",
  "Купон энэ захиалгад тохирохгүй байна",
  "Захиалгын дүн купоны нөхцөлийг хангахгүй байна",
  "Бэлгийн карт олдсонгүй",
  "Бэлгийн карт идэвхгүй байна",
  "Бэлгийн картын хугацаа дууссан",
  "Бэлгийн картын валют тохирохгүй байна",
  "Бэлгийн картын үлдэгдэл хүрэлцэхгүй байна",
];

/** `capture()` context used by the storefront cart submit flow. */
export const STORE_ORDER_SUBMIT_CONTEXT = "storefront: submit order";

/**
 * True when the error is an expected business rejection of the storefront
 * order-submit flow — shown to the buyer, never reported to Sentry.
 */
export function isExpectedStoreOrderRejection(
  error: unknown,
  ctx?: { context?: string },
): boolean {
  if (ctx?.context !== STORE_ORDER_SUBMIT_CONTEXT) return false;
  return STORE_ORDER_BUSINESS_MESSAGES.includes(errorMessage(error));
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return String(error);
}
