import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Нууцлалын бодлого — Zer",
  description:
    "Zer-ийн нууцлалын бодлого. Таны хувийн мэдээллийг хэрхэн цуглуулж, хадгалж, хамгаалдаг талаар.",
};

export default function PrivacyPage() {
  return (
    <div className="py-16 md:py-24">
      <div className="mx-auto max-w-3xl px-4">
        <h1 className="mb-6 font-display text-4xl leading-tight md:text-5xl">
          Нууцлалын бодлого
        </h1>
        <p className="mb-8 text-sm text-muted-foreground">
          Сүүлийн шинэчлэл: 2026 он
        </p>

        <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold">1. Танилцуулга</h2>
            <p className="text-muted-foreground leading-relaxed">
              Zer (&quot;бид&quot;, &quot;манай&quot;, &quot;Zer&quot;) нь таны
              хувийн мэдээллийн нууцлалыг хүндэтгэдэг. Энэхүү нууцлалын бодлого
              нь таны хувийн мэдээллийг бид хэрхэн цуглуулж, ашиглаж, хадгалж,
              хамгаалдаг талаар тайлбарлана.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">2. Мэдээллийн цуглуулга</h2>
            <p className="text-muted-foreground leading-relaxed">
              Бид таны тухай дараах мэдээллийг цуглуулж болно:
            </p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>Нэр, имэйл хаяг, утасны дугаар</li>
              <li>Байгууллагын нэр, хаяг</li>
              <li>Төлбөрийн мэдээлэл (төлбөр төлөх үед)</li>
              <li>Системийн ашиглалтын мэдээлэл (лог, IP хаяг)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">3. Мэдээллийн ашиглалт</h2>
            <p className="text-muted-foreground leading-relaxed">
              Бид цуглуулсан мэдээллийг дараах зорилгоор ашигладаг:
            </p>
            <ul className="list-disc pl-5 text-muted-foreground space-y-1">
              <li>Үйлчилгээг үзүүлэх, хадгалах, сайжруулах</li>
              <li>Таны бүртгэл, төлбөрийг удирдах</li>
              <li>Хэрэглэгчийн дэмжлэг үзүүлэх</li>
              <li>Холбогдох хууль тогтоомжийг дагаж мөрдөх</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">
              4. Мэдээллийн хадгалалт, аюулгүй байдал
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Таны мэдээллийг шифрлэгдсэн хэлбэрээр Supabase-ийн аюулгүй
              серверүүд дээр хадгална. Бид өдөр бүр нөөц хуулбар хийж,
              зөвшөөрөлгүй хандалтаас хамгаалах арга хэмжээ авдаг.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">5. Холбогдох</h2>
            <p className="text-muted-foreground leading-relaxed">
              Хэрэв та энэхүү нууцлалын бодлогын талаар асуулт байвал бидэнтэй
              hello@zer.mn хаягаар холбогдоно уу.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
