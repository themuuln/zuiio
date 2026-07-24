import { createClient } from "@/lib/supabase/server";
import { createPaymentInvoice } from "@/lib/payment-service";
import type { PremiumPlan } from "@/lib/payment-service";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { plan } = await request.json();
  if (!["monthly", "annual", "lifetime"].includes(plan)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("couple_id")
    .eq("id", user.id)
    .single();

  if (!profile?.couple_id) {
    return NextResponse.json({ error: "No couple found" }, { status: 400 });
  }

  try {
    const invoice = await createPaymentInvoice(
      plan as PremiumPlan,
      user.id,
      profile.couple_id,
    );
    return NextResponse.json({ invoice });
  } catch (error) {
    console.error("QPay invoice creation failed:", error);
    return NextResponse.json({ error: "Payment service unavailable" }, { status: 502 });
  }
}
