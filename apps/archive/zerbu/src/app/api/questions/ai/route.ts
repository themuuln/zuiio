import { createClient } from "@/lib/supabase/server";
import { generateDailyQuestion } from "@/lib/ai-service";
import { seedQuestions } from "@/data/questions";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, couple_id")
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
    return NextResponse.json({ message: "Question already exists", question: existing });
  }

  const { data: partner } = await supabase
    .from("profiles")
    .select("name")
    .eq("couple_id", profile.couple_id)
    .neq("id", user.id)
    .single();

  const { data: recentQuestions } = await supabase
    .from("questions")
    .select("question_text")
    .eq("couple_id", profile.couple_id)
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: recentMoods } = await supabase
    .from("moods")
    .select("mood, user_id")
    .eq("couple_id", profile.couple_id)
    .order("created_at", { ascending: false })
    .limit(2);

  let questionText: string;
  let source = "system";

  if (process.env.GEMINI_API_KEY) {
    try {
      questionText = await generateDailyQuestion({
        stage: undefined,
        partnerAName: profile.name,
        partnerBName: partner?.name,
        recentTopics: recentQuestions?.map((q) => q.question_text),
        moodA: recentMoods?.find((m) => m.user_id === user.id)?.mood,
        moodB: recentMoods?.find((m) => m.user_id !== user.id)?.mood,
      });
      source = "ai_generated";
    } catch {
      const pool = seedQuestions.filter((q) => q.source === "system");
      questionText = pool[Math.floor(Math.random() * pool.length)].question_text;
    }
  } else {
    const pool = seedQuestions.filter((q) => q.source === "system");
    questionText = pool[Math.floor(Math.random() * pool.length)].question_text;
  }

  const { data: question, error } = await supabase
    .from("questions")
    .insert({
      couple_id: profile.couple_id,
      question_text: questionText,
      category: "daily",
      source,
      scheduled_date: today,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ question });
}
