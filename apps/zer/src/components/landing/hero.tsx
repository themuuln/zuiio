import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center rounded-full border bg-muted px-4 py-1.5 text-sm text-muted-foreground">
            Жижиг дунд бизнест зориулсан ERP систем
          </div>

          <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
            Бизнесээ хялбархан
            <span className="text-primary"> удирдаарай</span>
          </h1>

          <p className="mb-10 text-lg text-muted-foreground md:text-xl">
            Бараа материалын бүртгэл, борлуулалт, зарлага, харилцагчийн
            менежмент - бүгд нэг системд. Монгол жижиг дунд бизнест зориулсан
            энгийн, хэрэгцээт ERP.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild className="w-full sm:w-auto">
              <Link href="/login">
                Үнэгүй эхлэх
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="w-full sm:w-auto"
            >
              <a href="#features">Дэлгэрэнгүй</a>
            </Button>
          </div>

          {/* TODO: Verify these metrics against real data before launch.
              "10,000 products", "500+ organizations", "95% satisfaction"
              are placeholder benchmarks. */}
          {/* Trust indicators — contextual proof */}
          <div className="mt-16 grid gap-x-12 gap-y-6 border-t pt-10 sm:grid-cols-3">
            <div className="text-left">
              <p className="text-sm font-medium">
                Барааны бүртгэл автоматжсан
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                10,000 гаруй бүтээгдэхүүний нөөц, үнэ, түүхийг нэг дэлгэцээс
                хянах боломжтой.
              </p>
            </div>
            <div className="text-left">
              <p className="text-sm font-medium">
                500+ байгууллага итгэж хэрэглэж байна
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Монголын жижиг дунд бизнес эрхлэгчид Zer-ийг сонгож, өдөр
                тутмын ажлаа дижитал хэлбэрт шилжүүлсэн.
              </p>
            </div>
            <div className="text-left">
              <p className="text-sm font-medium">
                Хэрэглэгчдийн 95% сэтгэл ханамжтай
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Судалгаанд оролцогчдын дийлэнх нь Zer ашигласнаар ажлын бүртгэл
                хөтлөх хугацаагаа эрс багасгасан гэж хариулсан.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
