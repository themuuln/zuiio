import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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

export function FAQ() {
  return (
    <section id="faq" className="border-t bg-muted/30 py-20 md:py-28">
      <div className="mx-auto max-w-3xl px-4">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            Түгээмэл асуултууд
          </h2>
          <p className="text-muted-foreground">
            Zer-ийн талаарх хамгийн түгээмэл асуулт, хариултууд.
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq) => (
            <AccordionItem key={faq.id} value={faq.id}>
              <AccordionTrigger className="text-left">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
