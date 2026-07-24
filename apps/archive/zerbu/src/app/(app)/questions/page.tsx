"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Question = {
  id: string;
  question_text: string;
  category: string | null;
  scheduled_date: string | null;
  is_answered_by_partner_a: boolean | null;
  is_answered_by_partner_b: boolean | null;
  revealed: boolean | null;
};

export default function QuestionsPage() {
  const supabase = createClient();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 15000);
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLoading(false); clearTimeout(timeout); return; }
      setProfileId(user.id);
      supabase
        .from("profiles")
        .select("couple_id")
        .eq("id", user.id)
        .single()
        .then(({ data: prof }) => {
          if (!prof?.couple_id) { setLoading(false); clearTimeout(timeout); return; }
          supabase
            .from("questions")
            .select()
            .eq("couple_id", prof.couple_id)
            .order("scheduled_date", { ascending: false })
            .limit(20)
            .then(({ data }) => {
              if (data) setQuestions(data as Question[]);
              setLoading(false);
              clearTimeout(timeout);
            });
        });
    });
    return () => clearTimeout(timeout);
  }, [supabase]);

  const categoryLabels: Record<string, string> = {
    daily: "Өдөр тутмын",
    intimacy: "Дотно",
    values: "Үнэт зүйлс",
    fun: "Хөгжилтэй",
    future: "Ирээдүй",
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="text-xl font-bold text-text dark:text-dark-text">Асуултууд</h1>

      {loading && <p className="text-text-secondary">Ачааллаж байна...</p>}

      {!loading && questions.length === 0 && (
        <Card className="text-center py-8">
          <p className="text-text-secondary">Одоогоор асуулт байхгүй байна</p>
        </Card>
      )}

      <div className="space-y-3">
        {questions.map((q) => {
          const answeredByMe = profileId === "loading" ? false : false;
          const partnerAnswered = false;
          return (
            <Link key={q.id} href={`/questions/${q.id}`}>
            <Card className="hover:shadow-warm-lg transition-shadow cursor-pointer">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {q.category && (
                      <Badge variant={q.category === "intimacy" ? "warning" : "primary"}>
                        {categoryLabels[q.category] || q.category}
                      </Badge>
                    )}
                  </div>
                  <CardTitle>{q.question_text}</CardTitle>
                  {q.scheduled_date && (
                    <CardDescription>
                      {new Date(q.scheduled_date).toLocaleDateString("mn-MN")}
                    </CardDescription>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                <span className={`text-xs ${q.is_answered_by_partner_a ? "text-success" : "text-text-secondary"}`}>
                  {q.is_answered_by_partner_a ? "✔ Хариулсан" : "— Хариулаагүй"}
                </span>
                <span className={`text-xs ${q.is_answered_by_partner_b ? "text-success" : "text-text-secondary"}`}>
                  {q.is_answered_by_partner_b ? "✔ Хамтрагч хариулсан" : "— Хамтрагч хариулаагүй"}
                </span>
              </div>
            </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
