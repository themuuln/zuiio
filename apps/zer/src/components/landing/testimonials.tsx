import { Quotes, Star } from "@phosphor-icons/react/dist/ssr";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Illustrative testimonials — replace with real customer quotes before launch.
// These represent typical use cases and roles for the target market.

const testimonials = [
  {
    name: "Батбаяр С.",
    role: "Номин Худалдаа, захирал",
    businessType: "Ритейл дэлгүүр",
    content:
      "Zer руу шилжсэний дараа манай ритейл сүлжээний бүртгэл цахимжсан. Онлайн дэлгүүрийн системээр бүтээгдэхүүнүүдээ шууд нэмдэг, нөөцийг цаг хугацаатай хянадаг болсон.",
  },
  {
    name: "Долгор Д.",
    role: "Гоёо ХХК, нягтлан",
    businessType: "Үйлдвэрлэл",
    content:
      "Өмнө нь сар бүр Excel-ээр тайлан гаргахад 3-4 хоног зарцуулдаг байсан. Zer-ийн тайлангийн модулиар бүх борлуулалт, зарлагын мэдээллийг минутын дотор хардаг болсон.",
  },
  {
    name: "Энхтүвшин Б.",
    role: "Тэнгэр Сувг ХХК, эзэмшигч",
    businessType: "Бөөний худалдаа",
    content:
      "Гурван агуулахтай бизнесээ нэгэн зүгээр хянах болсон. Барааны нөөц, өглөг авлагыг реалтай цагт шалгаж болдог нь маш их хугацаа хэмнэж байна.",
  },
  {
    name: "Золзаяа М.",
    role: "Фитнес Зүрх, эзэн",
    businessType: "Үйлчилгээ / Фитнес",
    content:
      "Zer-ийн AI Телеграм ботоор үйлчлүүлэгчид маань захиалга өгч, нөхцөлийг цаг тутам мэдэж байна. Бид үйлчилгээнийхээ чанарыг технологийн тусламжтайгаар дээшлүүлж байна.",
  },
];

const starIds = [0, 1, 2, 3, 4];
const stars = starIds.map((id) => (
  <Star key={id} weight="fill" className="size-4 text-amber-500 shrink-0" />
));

export function Testimonials() {
  return (
    <section
      id="testimonials"
      className="relative overflow-hidden border-t bg-muted/30 py-20 md:py-28"
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/3 top-0 h-64 w-64 rounded-full bg-primary/[0.02] blur-[100px]" />
      </div>

      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-16 max-w-2xl">
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-primary">
            Сэтгэгдэл
          </p>
          <h2 className="mb-4 font-display text-4xl leading-tight md:text-5xl">
            Хэрэглэгчдийн сэтгэгдэл
          </h2>
          <p className="text-base text-muted-foreground md:text-lg">
            Zer-ийг ашиглаж буй бизнес эрхлэгчид, нягтлан бодогчдын сэтгэгдэл.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.name}
              className="group relative rounded-2xl border border-border/60 bg-background p-6 shadow-sm transition-all duration-200 hover:shadow-md md:p-8"
            >
              <Quotes
                weight="fill"
                className="absolute right-5 top-5 size-6 text-primary/10 md:right-6 md:top-6 md:size-8"
              />
              <div className="mb-3 flex gap-1">{stars}</div>
              <span className="mb-4 inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                {testimonial.businessType}
              </span>
              <p className="mb-6 text-sm leading-relaxed text-muted-foreground md:mb-8 md:text-base">
                &ldquo;{testimonial.content}&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <Avatar className="size-10 ring-2 ring-border">
                  <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">
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
