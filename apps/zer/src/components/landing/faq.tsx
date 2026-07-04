"use client";

import { CaretDown, Question } from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";

const faqs = [
  {
    id: "zer-intro",
    question: "Zer гэж юу вэ?",
    answer:
      "Zer бол жижиг дунд бизнест зориулсан ERP систем юм. Бараа материалын бүртгэл, борлуулалт, зарлага, харилцагчийн менежмент зэрэг бизнесийн үйл ажиллагааг бүрэн дижитал хэлбэрт шилжүүлэх боломжтой.",
  },
  {
    id: "how-to-start",
    question: "Zer-ийг хэрхэн ашиглаж эхлэх вэ?",
    answer:
      "Бүртгүүлээд нэвтрэн орж, байгууллагын мэдээллээ бүртгүүлэхэд л хангалттай. Дараа нь бараа, харилцагч, борлуулалтаа бүртгэж эхлэх боломжтой.",
  },
  {
    id: "free-tier",
    question: "Үнэгүй хувилбарт ямар боломжууд байдаг вэ?",
    answer:
      "Үнэгүй хувилбарт 50 хүртэлх бараа бүртгэх, борлуулалт, зарлагын бүртгэл хийх, үндсэн тайлан гаргах боломжтой.",
  },
  {
    id: "security",
    question: "Өгөгдөл маань аюулгүй юу?",
    answer:
      "Тийм. Бүх өгөгдөл шифрлэгдсэн байдлаар хадгалагдаж, Supabase-ийн аюулгүй серверүүд дээр хадгалагдана. Өдөр бүр нөөц хуулбар хийгддэг.",
  },
  {
    id: "upgrade",
    question: "Төлөвлөгөөгөө хэрхэн шинэчлэх вэ?",
    answer:
      "Тохиргоо хэсгээс төлөвлөгөөгөө хүссэн үедээ шинэчлэх боломжтой. Шинэчлэлт нэн даруй хэрэгжиж, өмнөх төлбөрийн үлдэгдэл автоматаар тооцогдоно.",
  },
  {
    id: "support",
    question: "Техникийн дэмжлэг хэрхэн авах вэ?",
    answer:
      "Стандарт төлөвлөгөөний хэрэглэгчид имэйл, онлайнаар зөвлөгөө авах боломжтой. Аж ахуйн төлөвлөгөөний хэрэглэгчид 24/7 утасны дэмжлэг авах боломжтой.",
  },
];

function FAQCard({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`cursor-pointer rounded-xl border bg-background p-5 transition-colors hover:bg-muted/50 ${
        open ? "ring-1 ring-primary/20" : ""
      }`}
      onClick={() => setOpen(!open)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setOpen(!open);
        }
      }}
      role="button"
      tabIndex={0}
      aria-expanded={open}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Question className="mt-0.5 size-5 shrink-0 text-primary" />
          <h3 className="text-sm font-medium">{question}</h3>
        </div>
        <CaretDown
          className={`mt-1 size-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </div>
      {open && (
        <p className="mt-4 border-l-2 border-primary/20 pl-4 text-sm leading-relaxed text-muted-foreground">
          {answer}
        </p>
      )}
    </div>
  );
}

export function FAQ() {
  return (
    <section id="faq" className="border-t bg-muted/30 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-12 max-w-2xl">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            Түгээмэл асуултууд
          </h2>
          <p className="text-muted-foreground">
            Zer-ийн талаарх хамгийн түгээмэл асуулт, хариултууд.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {faqs.map((faq) => (
            <FAQCard key={faq.id} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </div>
    </section>
  );
}
