import { Star } from "@phosphor-icons/react/dist/ssr";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const testimonials = [
  {
    name: "Батбаяр С.",
    role: "Номин Худалдаа, захирал",
    content:
      "Zer ашигласнаар бараа материалын бүртгэл маань бүрэн автоматжаж, алдаа дутагдлыг эрс багасгасан. Хамгийн таалагдсан нь online дэлгүүрийн систем.",
  },
  {
    name: "Долгор Д.",
    role: "Гоёо ХХК, нягтлан",
    content:
      "Борлуулалт, зарлагын тайланг хэдхэн товчлуур дээр гаргаж авах боломжтой болсон. Өмнө нь Excel-ээр хоног суудаг байсан ажил одоо минут болсон.",
  },
  {
    name: "Энхтүвшин Б.",
    role: "Тэнгэр Сувг ХХК, эзэмшигч",
    content:
      "Харилцагчдын өглөг авлагыг хянах, барааны нөөцөө шалгах зэрэг нь маш хялбар болсон. Жижиг бизнест заавар болгож өгөх систем.",
  },
];

const starIds = [0, 1, 2, 3, 4];
const stars = starIds.map((id) => (
  <Star key={id} weight="fill" className="size-4 text-amber-500 shrink-0" />
));

export function Testimonials() {
  return (
    <section id="testimonials" className="border-t bg-muted/30 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-16 max-w-2xl">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            Хэрэглэгчдийн сэтгэгдэл
          </h2>
          <p className="text-muted-foreground">
            Zer-ийг ашиглаж буй бизнес эрхлэгчид, нягтлан бодогчдын сэтгэгдэл.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-[1.4fr_1fr_1fr]">
          {/* Featured testimonial — wider */}
          <div className="rounded-xl border bg-background p-6 md:p-8">
            <div className="mb-4 flex gap-1">{stars}</div>
            <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
              &ldquo;{testimonials[1].content}&rdquo;
            </p>
            <div className="flex items-center gap-3">
              <Avatar className="size-10">
                <AvatarFallback className="text-xs">
                  {testimonials[1].name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{testimonials[1].name}</p>
                <p className="text-xs text-muted-foreground">
                  {testimonials[1].role}
                </p>
              </div>
            </div>
          </div>

          {/* Remaining testimonials — compact */}
          {[testimonials[0], testimonials[2]].map((testimonial) => (
            <div
              key={testimonial.name}
              className="rounded-xl border bg-background p-6"
            >
              <div className="mb-4 flex gap-1">{stars}</div>
              <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                &ldquo;{testimonial.content}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <Avatar className="size-10">
                  <AvatarFallback className="text-xs">
                    {testimonial.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{testimonial.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
