import { createClient } from "@/lib/supabase/server";
import { seedQuestions } from "@/data/questions";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("couple_id")
    .eq("id", user.id)
    .single();

  if (!profile?.couple_id) {
    return NextResponse.json({ error: "No couple found" }, { status: 400 });
  }

  const today = new Date().toISOString().split("T")[0];

  const { data: existing } = await supabase
    .from("questions")
    .select("id")
    .eq("couple_id", profile.couple_id)
    .eq("scheduled_date", today)
    .single();

  if (existing) {
    return NextResponse.json({ message: "Question already assigned for today", question: existing });
  }

  const { data: answeredCategories } = await supabase
    .from("questions")
    .select("category")
    .eq("couple_id", profile.couple_id);

  const usedCategories = answeredCategories
    ? answeredCategories.map((q) => q.category).filter(Boolean)
    : [];

  const available = seedQuestions.filter((q) => !usedCategories.includes(q.category));
  const pool = available.length > 0 ? available : seedQuestions;
  const pick = pool[Math.floor(Math.random() * pool.length)];

  const { data: question, error } = await supabase
    .from("questions")
    .insert({
      couple_id: profile.couple_id,
      question_text: pick.question_text,
      category: pick.category,
      source: pick.source,
      scheduled_date: today,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ question });
}
