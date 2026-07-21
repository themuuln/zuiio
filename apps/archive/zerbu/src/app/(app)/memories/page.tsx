"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Image, Plus } from "@phosphor-icons/react";
import { SkeletonCard } from "@/components/ui/skeleton";

type Memory = {
  id: string;
  title: string | null;
  description: string | null;
  memory_type: string | null;
  date: string | null;
  photo_url: string | null;
  created_at: string | null;
};

export default function MemoriesPage() {
  const supabase = createClient();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [coupleId, setCoupleId] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("profiles")
        .select("couple_id")
        .eq("id", user.id)
        .single()
        .then(({ data: prof }) => {
          if (!prof?.couple_id) return;
          setCoupleId(prof.couple_id);
          loadMemories(prof.couple_id);
        });
    });
  }, [supabase]);

  function loadMemories(cId: string) {
    supabase
      .from("memories")
      .select()
      .eq("couple_id", cId)
      .order("date", { ascending: false })
      .then(({ data }) => {
        if (data) setMemories(data as Memory[]);
        setLoading(false);
      });
  }

  async function handleAdd() {
    if (!newTitle.trim() || !coupleId) return;
    const { data: user } = await supabase.auth.getUser();
    await supabase.from("memories").insert({
      couple_id: coupleId,
      title: newTitle,
      description: newDescription || null,
      date: new Date().toISOString().split("T")[0],
      memory_type: "journal",
      created_by: user.data?.user?.id,
    });
    setNewTitle("");
    setNewDescription("");
    setShowModal(false);
    loadMemories(coupleId);
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text dark:text-dark-text">Дурсамж</h1>
        <Button size="sm" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Шинэ
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : memories.length === 0 ? (
        <Card className="text-center py-12 border-dashed border-2 border-secondary/30">
          <Image size={48} className="mx-auto text-text-secondary mb-3" />
          <p className="text-text-secondary">Дурсамж байхгүй байна.</p>
          <p className="text-text-secondary text-sm mt-1">Эхний дурсамжаа нэмээрэй!</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {memories.map((mem) => (
            <Card key={mem.id}>
              <CardTitle>{mem.title}</CardTitle>
              {mem.description && <CardDescription>{mem.description}</CardDescription>}
              <p className="text-xs text-text-secondary mt-2">
                {mem.date ? new Date(mem.date).toLocaleDateString("mn-MN") : ""}
                {mem.memory_type && ` · ${mem.memory_type}`}
              </p>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Шинэ дурсамж">
        <div className="space-y-3">
          <Input label="Гарчиг" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
          <Input label="Тайлбар" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
          <Button onClick={handleAdd} fullWidth>Хадгалах</Button>
        </div>
      </Modal>
    </div>
  );
}
