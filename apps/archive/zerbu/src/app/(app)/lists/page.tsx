"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Tabs } from "@/components/ui/tabs";
import { CheckCircle, ClipboardText, Plus } from "@phosphor-icons/react";
import { SkeletonCard } from "@/components/ui/skeleton";

type ListItem = {
  id: string;
  title: string;
  list_type: string;
  is_completed: boolean | null;
};

const listTypes = [
  { id: "date_ideas", label: "Болзоо" },
  { id: "bucket_list", label: "Мөрөөдөл" },
  { id: "grocery", label: "Дэлгүүр" },
  { id: "to_do", label: "Хийх" },
];

export default function ListsPage() {
  const supabase = createClient();
  const [items, setItems] = useState<ListItem[]>([]);
  const [activeType, setActiveType] = useState("date_ideas");
  const [coupleId, setCoupleId] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
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
          loadItems(prof.couple_id, activeType);
        });
    });
  }, [supabase]);

  function loadItems(cId: string, type: string) {
    supabase
      .from("shared_lists")
      .select()
      .eq("couple_id", cId)
      .eq("list_type", type)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setItems(data as ListItem[]);
        setLoading(false);
      });
  }

  function handleTypeChange(type: string) {
    setActiveType(type);
    if (coupleId) loadItems(coupleId, type);
  }

  async function handleAdd() {
    if (!newTitle.trim() || !coupleId) return;
    const { data: user } = await supabase.auth.getUser();
    await supabase.from("shared_lists").insert({
      couple_id: coupleId,
      list_type: activeType,
      title: newTitle.trim(),
      created_by: user.data?.user?.id,
    });
    setNewTitle("");
    setShowModal(false);
    loadItems(coupleId, activeType);
  }

  async function toggleComplete(item: ListItem) {
    await supabase
      .from("shared_lists")
      .update({ is_completed: !item.is_completed })
      .eq("id", item.id);
    loadItems(coupleId, activeType);
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text dark:text-dark-text">Жагсаалт</h1>
        <Button size="sm" onClick={() => setShowModal(true)}>
          <Plus size={18} /> Нэмэх
        </Button>
      </div>

      <Tabs tabs={listTypes} activeTab={activeType} onTabChange={handleTypeChange} />

      {loading ? (
        <div className="space-y-2">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : items.length === 0 ? (
        <Card className="text-center py-8 border-dashed border-2 border-secondary/30">
          <ClipboardText size={40} className="mx-auto text-text-secondary mb-3" />
          <p className="text-text-secondary">Жагсаалт хоосон байна.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <Card
              key={item.id}
              onClick={() => toggleComplete(item)}
              className={`flex items-center gap-3 cursor-pointer transition-opacity ${
                item.is_completed ? "opacity-50" : ""
              }`}
            >
              <CheckCircle
                size={22}
                weight={item.is_completed ? "fill" : "regular"}
                className={item.is_completed ? "text-success" : "text-text-secondary"}
              />
              <span
                className={`flex-1 text-text dark:text-dark-text ${
                  item.is_completed ? "line-through" : ""
                }`}
              >
                {item.title}
              </span>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Шинэ жагсаалт">
        <div className="space-y-3">
          <Input
            label="Гарчиг"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Жагсаалтаа бичээрэй..."
          />
          <Button onClick={handleAdd} fullWidth>Нэмэх</Button>
        </div>
      </Modal>
    </div>
  );
}
