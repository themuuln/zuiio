import { redirect } from "next/navigation";

// Checkout now lives in a slide-in drawer (CheckoutDrawer) opened from the
// cart panel / cart sheet. Keep this route as a redirect for old links.
export default function CheckoutPage() {
  redirect("/shop");
}
