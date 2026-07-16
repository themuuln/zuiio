"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from "date-fns";
import { mn } from "date-fns/locale";
import { Plus, CalendarBlank } from "@phosphor-icons/react";
import { SkeletonCard } from "@/components/ui/skeleton";

type CalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_type: string | null;
};

export default function CalendarPage() {
  const supabase = createClient();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [coupleId, setCoupleId] = useState("");
  const [loading, setLoading] = useState(true);

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const startPad = startOfMonth(currentMonth).getDay();
  const paddedDays = Array(startPad).fill(null).concat(days);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("profiles")
        .select("couple_id")
        .eq("id", user.id)
        .single()
        .then(({ data: prof }) => {
          const p = prof as { couple_id: string } | null;
          if (!p?.couple_id) return;
          setCoupleId(p.couple_id);
          loadEvents(p.couple_id);
        });
    });
  }, [supabase]);

  function loadEvents(cId: string) {
    supabase
      .from("calendar_events")
      .select()
      .eq("couple_id", cId)
      .order("event_date", { ascending: true })
      .then(({ data }) => {
        if (data) setEvents(data as CalendarEvent[]);
        setLoading(false);
      });
  }

  async function handleAddEvent() {
    if (!newTitle.trim() || !selectedDate || !coupleId) return;
    await (supabase.from("calendar_events") as any).insert({
      couple_id: coupleId,
      title: newTitle,
      description: newDescription || null,
      event_date: selectedDate.toISOString(),
    });
    setNewTitle("");
    setNewDescription("");
    setShowModal(false);
    loadEvents(coupleId);
  }

  const dayEvents = (date: Date) =>
    events.filter((e) => isSameDay(new Date(e.event_date), date));

  const monthEvents = events.filter((e) => isSameMonth(new Date(e.event_date), currentMonth));

  const eventTypeColors: Record<string, string> = {
    date_night: "bg-primary/10 text-primary border-l-primary",
    anniversary: "bg-accent-gold/10 text-accent-gold border-l-accent-gold",
    appointment: "bg-accent-sky/10 text-accent-sky border-l-accent-sky",
    reminder: "bg-accent-steppe/10 text-accent-steppe border-l-accent-steppe",
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text dark:text-dark-text">Календарь</h1>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
          >
            ←
          </Button>
          <span className="text-sm font-medium self-center px-2">
            {format(currentMonth, "yyyy MMM", { locale: mn })}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
          >
            →
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <>
          <Card>
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {["Ня", "Да", "Мя", "Лх", "Пү", "Ба", "Бя"].map((d) => (
                <span key={d} className="text-xs text-text-secondary font-medium py-1">{d}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {paddedDays.map((day, i) => {
                if (!day) return <div key={`empty-${i}`} />;
                const hasEvents = dayEvents(day).length > 0;
                return (
                  <button
                    type="button"
                    key={day.toISOString()}
                    onClick={() => {
                      setSelectedDate(day);
                      setShowModal(true);
                    }}
                    className={`relative p-2 rounded-[8px] text-sm transition-colors cursor-pointer
                      ${isToday(day) ? "bg-primary/10 text-primary font-bold" : "text-text dark:text-dark-text hover:bg-secondary/10"}
                      ${isSameDay(day, selectedDate || new Date(0)) ? "ring-2 ring-primary" : ""}
                    `}
                  >
                    {format(day, "d")}
                    {hasEvents && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />}
                  </button>
                );
              })}
            </div>
          </Card>

          {monthEvents.length === 0 ? (
            <Card className="text-center py-12 border-dashed border-2 border-secondary/30">
              <CalendarBlank size={48} className="mx-auto text-text-secondary mb-3" />
              <p className="text-text-secondary">Энэ сард үйл явдал байхгүй</p>
            </Card>
          ) : (
            selectedDate && (
              <div>
                <h2 className="font-semibold text-text dark:text-dark-text mb-2">
                  {format(selectedDate, "yyyy MMM d", { locale: mn })}
                </h2>
                <div className="space-y-2">
                  {dayEvents(selectedDate).length === 0 && (
                    <p className="text-text-secondary text-sm">Энэ өдөр үйл явдал байхгүй</p>
                  )}
                  {dayEvents(selectedDate).map((event) => (
                    <Card key={event.id} className={`border-l-4 ${eventTypeColors[event.event_type || "reminder"] || "border-l-secondary"}`}>
                      <CardTitle>{event.title}</CardTitle>
                      {event.description && <CardDescription>{event.description}</CardDescription>}
                    </Card>
                  ))}
                </div>
              </div>
            )
          )}
        </>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Шинэ үйл явдал">
        <div className="space-y-3">
          <Input label="Гарчиг" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
          <Input label="Тодорхойлолт" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
          <Button onClick={handleAddEvent} fullWidth>Нэмэх</Button>
        </div>
      </Modal>
    </div>
  );
}
