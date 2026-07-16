"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, PaperPlaneRight } from "@phosphor-icons/react";

type Question = {
  id: string;
  question_text: string;
  category: string | null;
  source: string | null;
  scheduled_date: string | null;
  is_answered_by_partner_a: boolean | null;
  is_answered_by_partner_b: boolean | null;
  revealed: boolean | null;
};

type Response = {
  id: string;
  content: string;
  mood_emoji: string | null;
  user_id: string;
  created_at: string | null;
};

type Reply = {
  id: string;
  content: string;
  author_id: string;
  created_at: string | null;
};

export default function QuestionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [question, setQuestion] = useState<Question | null>(null);
  const [profileId, setProfileId] = useState("");
  const [profileName, setProfileName] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [myResponse, setMyResponse] = useState<Response | null>(null);
  const [partnerResponse, setPartnerResponse] = useState<Response | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [answer, setAnswer] = useState("");
  const [answerMode, setAnswerMode] = useState<"show" | "write">("show");
  const [revealMode, setRevealMode] = useState<"waiting" | "revealed">("waiting");
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setProfileId(user.id);
      loadQuestion(user.id);
    });
  }, [params.id]);

  async function loadQuestion(uId: string) {
    const { data: q } = await supabase
      .from("questions")
      .select()
      .eq("id", params.id as string)
      .single();
    if (!q) return;

    const questionData = q as Question;
    setQuestion(questionData);

    const { data: prof } = await supabase
      .from("profiles")
      .select("name, couple_id")
      .eq("id", uId)
      .single();
    if (prof) {
      setProfileName(prof.name);
      if (prof.couple_id) {
        const { data: partner } = await supabase
          .from("profiles")
          .select("name")
          .eq("couple_id", prof.couple_id)
          .neq("id", uId)
          .single();
        if (partner) setPartnerName(partner.name);
      }
    }

    const { data: responses } = await supabase
      .from("responses")
      .select()
      .eq("question_id", params.id as string);
    if (responses) {
      const myResp = responses.find((r) => r.user_id === uId) as Response | undefined;
      const partnerResp = responses.find((r) => r.user_id !== uId) as Response | undefined;
      if (myResp) {
        setMyResponse(myResp);
        setAnswerMode("show");
      }
      if (partnerResp) {
        setPartnerResponse(partnerResp);
        if (questionData.revealed && myResp) {
          setRevealMode("revealed");
        } else if (myResp && !questionData.revealed) {
          setRevealMode("waiting");
        }
      }
    }

    const { data: replyData } = await supabase
      .from("replies")
      .select()
      .eq("response_id", responses?.[0]?.id || "")
      .order("created_at", { ascending: true });
    if (replyData) setReplies(replyData as Reply[]);
  }

  async function handleSubmitAnswer() {
    if (!answer.trim() || !question) return;
    const { data: resp } = await supabase
      .from("responses")
      .insert({
        question_id: question.id,
        user_id: profileId,
        content: answer.trim(),
      })
      .select()
      .single();
    if (resp) {
      setMyResponse(resp as Response);
      setAnswerMode("show");

      if (partnerResponse) {
        await supabase
          .from("questions")
          .update({ revealed: true })
          .eq("id", question.id);
        setRevealMode("revealed");
      }

      await updateStreak();
    }
  }

  async function handleReveal() {
    if (!question) return;
    await supabase
      .from("questions")
      .update({ revealed: true })
      .eq("id", question.id);
    setRevealMode("revealed");
  }

  async function updateStreak() {
    const { data: prof } = await supabase
      .from("profiles")
      .select("couple_id")
      .eq("id", profileId)
      .single();
    if (!prof?.couple_id) return;

    const today = new Date().toISOString().split("T")[0];
    const { data: streak } = await supabase
      .from("streaks")
      .select()
      .eq("couple_id", prof.couple_id)
      .single();

    if (streak) {
      const lastDate = streak.last_activity_date;
      const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
      const newStreak = lastDate === yesterday
        ? (streak.current_streak || 0) + 1
        : lastDate === today
          ? streak.current_streak
          : 1;
      await supabase
        .from("streaks")
        .update({
          current_streak: newStreak,
          longest_streak: Math.max(newStreak, streak.longest_streak || 0),
          last_activity_date: today,
        })
        .eq("id", streak.id);
    } else {
      await supabase.from("streaks").insert({
        couple_id: prof.couple_id,
        current_streak: 1,
        longest_streak: 1,
        last_activity_date: today,
      });
    }
  }

  async function handleReply() {
    if (!replyText.trim() || !myResponse) return;
    await supabase.from("replies").insert({
      response_id: myResponse.id,
      author_id: profileId,
      content: replyText.trim(),
    });
    setReplyText("");
    const { data } = await supabase
      .from("replies")
      .select()
      .eq("response_id", myResponse.id)
      .order("created_at", { ascending: true });
    if (data) setReplies(data as Reply[]);
  }

  if (!question) {
    return (
      <div className="flex justify-center py-12">
        <p className="text-text-secondary">Ачааллаж байна...</p>
      </div>
    );
  }

  const categoryLabels: Record<string, string> = {
    daily: "Өдөр тутмын",
    intimacy: "Дотно",
    values: "Үнэт зүйлс",
    fun: "Хөгжилтэй",
    future: "Ирээдүй",
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-1 text-text-secondary hover:text-text transition-colors cursor-pointer"
      >
        <ArrowLeft size={18} />
        <span className="text-sm">Буцах</span>
      </button>

      <Card>
        <div className="flex items-center gap-2 mb-3">
          {question.category && (
            <Badge variant={question.category === "intimacy" ? "warning" : "primary"}>
              {categoryLabels[question.category] || question.category}
            </Badge>
          )}
          {question.scheduled_date && (
            <span className="text-xs text-text-secondary">
              {new Date(question.scheduled_date).toLocaleDateString("mn-MN")}
            </span>
          )}
        </div>
        <CardTitle className="text-lg leading-relaxed">{question.question_text}</CardTitle>
      </Card>

      {answerMode === "write" && (
        <div className="space-y-3 animate-slide-up">
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Хариултаа бичээрэй..."
            rows={4}
            className="w-full px-4 py-3 rounded-[16px] bg-surface dark:bg-dark-surface border-2 border-secondary/30 dark:border-dark-surface text-text dark:text-dark-text placeholder:text-text-secondary/50 focus:outline-none focus:border-primary transition-colors resize-none"
          />
          <Button onClick={handleSubmitAnswer} disabled={!answer.trim()} fullWidth>
            Хариулт илгээх
          </Button>
        </div>
      )}

      {myResponse && revealMode === "waiting" && (
        <div className="text-center space-y-3">
          <Card className="bg-accent-steppe/5 border-accent-steppe/20">
            <p className="text-sm text-text-secondary">Таны хариултыг хадгалсан. Хамтрагч тань хариулсны дараа харах боломжтой.</p>
          </Card>
          {!partnerResponse ? (
            <p className="text-text-secondary text-sm">Хамтрагчаа хүлээж байна...</p>
          ) : (
            <Button onClick={handleReveal}>
              Хариултуудыг харах
            </Button>
          )}
        </div>
      )}

      {revealMode === "revealed" && myResponse && partnerResponse && (
        <div className="grid gap-4 animate-fade-in">
          <Card className="border-l-4 border-l-primary">
            <div className="flex items-center gap-2 mb-2">
              <Avatar name={profileName} size="sm" />
              <span className="font-medium text-sm text-text dark:text-dark-text">{profileName}</span>
            </div>
            <p className="text-text dark:text-dark-text">{myResponse.content}</p>
          </Card>

          <Card className="border-l-4 border-l-accent-steppe">
            <div className="flex items-center gap-2 mb-2">
              <Avatar name={partnerName} size="sm" />
              <span className="font-medium text-sm text-text dark:text-dark-text">{partnerName}</span>
            </div>
            <p className="text-text dark:text-dark-text">{partnerResponse.content}</p>
          </Card>
        </div>
      )}

      {revealMode === "revealed" && (
        <div className="space-y-3">
          <h3 className="font-semibold text-text dark:text-dark-text">Харилцан яриа</h3>
          <div className="space-y-2">
            {replies.map((reply) => (
              <Card key={reply.id} className="py-2 px-4">
                <p className="text-sm text-text dark:text-dark-text">{reply.content}</p>
              </Card>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Хариу бичих..."
              onKeyDown={(e) => e.key === "Enter" && handleReply()}
              className="flex-1 px-4 py-2.5 rounded-full bg-surface dark:bg-dark-surface border-2 border-secondary/30 dark:border-dark-surface text-text dark:text-dark-text placeholder:text-text-secondary/50 focus:outline-none focus:border-primary transition-colors text-sm"
            />
            <Button onClick={handleReply} size="sm" className="rounded-full w-10 h-10 p-0 flex items-center justify-center">
              <PaperPlaneRight size={16} />
            </Button>
          </div>
        </div>
      )}

      {!myResponse && answerMode === "show" && (
        <div className="space-y-3">
          <Button onClick={() => setAnswerMode("write")} fullWidth>
            Хариулах
          </Button>
        </div>
      )}
    </div>
  );
}
