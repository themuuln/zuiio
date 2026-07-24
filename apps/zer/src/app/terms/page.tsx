import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Үйлчилгээний нөхцөл — Zer",
  description:
    "Zer системийг ашиглах үйлчилгээний нөхцөл, хэрэглэгчийн эрх, үүргийн талаар.",
};

export default function TermsPage() {
  return (
    <div className="py-16 md:py-24">
      <div className="mx-auto max-w-3xl px-4">
        <h1 className="mb-6 font-display text-4xl leading-tight md:text-5xl">
          Үйлчилгээний нөхцөл
        </h1>
        <p className="mb-8 text-sm text-muted-foreground">
          Сүүлийн шинэчлэл: 2026 он
        </p>

        <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold">1. Нөхцөлийн хүрээ</h2>
            <p className="text-muted-foreground leading-relaxed">
              Zer системийг ашигласнаар та эдгээр үйлчилгээний нөхцөлийг хүлээн
              зөвшөөрч байна. Хэрэв та нөхцөлийг хүлээн зөвшөөрөхгүй бол
              системийг ашиглах боломжгүй.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">2. Бүртгэл, хариуцлага</h2>
            <p className="text-muted-foreground leading-relaxed">
              Бүртгэлийн мэдээллийн үнэн зөвийг хангах, нууц үгийн аюулгүй
              байдлыг хангах нь хэрэглэгчийн хариуцлага юм. Таны бүртгэлээр
              хийгдсэн бүх үйлдэлд та хариуцлага хүлээнэ.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">3. Үйлчилгээний ашиглалт</h2>
            <p className="text-muted-foreground leading-relaxed">
              Zer системийг хууль ёсны зорилгоор ашиглах ёстой. Системийн хэвийн
              ажиллагааг алдагдуулах, бусад хэрэглэгчийн эрхэд халдах, хууль бус
              үйлдэл хийхийг хориглоно.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">4. Оюуны өмч</h2>
            <p className="text-muted-foreground leading-relaxed">
              Zer систем, түүний бүх эрх, контент, дизайн, код нь Zer-ийн оюуны
              өмч болно. Системийн аль ч хэсгийг зөвшөөрөлгүйгээр хуулах,
              түгээх, өөрчлөхийг хориглоно.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">5. Төлбөр, төлөвлөгөө</h2>
            <p className="text-muted-foreground leading-relaxed">
              Төлбөртэй төлөвлөгөөний төлбөрийг сар бүр урьдчилан авна.
              Төлөвлөгөөгөө хүссэн үедээ шинэчлэх, цуцлах боломжтой. Цуцлалтын
              дараа төлбөр буцаан олгогдохгүй.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">
              6. Хариуцлагын хязгаарлалт
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Zer системийн ашиглалтаас үүссэн шууд бус хохирлыг бид
              хариуцахгүй. Системийн тасралтгүй ажиллагааг хангахыг эрмэлздэг
              боловч 100% баталгаа өгөхгүй.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">7. Холбогдох</h2>
            <p className="text-muted-foreground leading-relaxed">
              Асуулт, санал хүсэлтээ hello@zer.mn хаягаар илгээнэ үү.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
