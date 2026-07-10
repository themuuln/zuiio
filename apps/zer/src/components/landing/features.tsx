import {
  ChartBar,
  CreditCard,
  CurrencyDollar,
  Package,
  Storefront,
  Users,
} from "@phosphor-icons/react/dist/ssr";

const features = [
  {
    icon: Package,
    title: "Бараа материалын бүртгэл",
    description:
      "Бүтээгдэхүүн, ангилал, нэгжийн бүртгэл. Автомат тооллого, барааны код, үнийн түүх.",
    why: "Бараа материалаа хянаж, тооллого автоматжуулж, бодит үлдэгдлийг мэдэж ажиллана.",
  },
  {
    icon: CurrencyDollar,
    title: "Борлуулалтын удирдлага",
    description:
      "Борлуулалтын баримт үүсгэх, захиалга боловсруулах, борлуулалтын түүх харах.",
  },
  {
    icon: CreditCard,
    title: "Зарлагын бүртгэл",
    description:
      "Зарлагын төрөл, дүн, огноогоор бүртгэх. Сарын зарлагын тайлан, харьцуулалт.",
  },
  {
    icon: Users,
    title: "Харилцагчийн менежмент",
    description:
      "Харилцагч, нийлүүлэгчийн дэлгэрэнгүй мэдээлэл, түүх, өглөг/авлагын хяналт.",
  },
  {
    icon: ChartBar,
    title: "Тайлан, шинжилгээ",
    description:
      "Борлуулалт, зарлага, ашгийн тайлан. График, диаграммаар харах, PDF экспорт.",
  },
  {
    icon: Storefront,
    title: "Дэлгүүрийн систем",
    description:
      "Online дэлгүүр, сагс, захиалга, төлбөрийн баримт. Үйлчлүүлэгчид өөрсдөө захиалах.",
  },
];

export function Features() {
  const [heroFeature, ...restFeatures] = features;
  const HeroIcon = heroFeature.icon;

  return (
    <section id="features" className="border-t py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-16 max-w-2xl">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            Бизнест хэрэгтэй бүх боломжууд
          </h2>
          <p className="text-muted-foreground">
            Zer нь жижиг дунд бизнесийн үйл ажиллагааг бүрэн дижитал хэлбэрт
            шилжүүлэхэд хэрэгтэй бүх хэрэгслүүдийг санал болгодог.
          </p>
        </div>

        {/* Hero feature — spans full width with more substance */}
        <div className="mb-10 rounded-xl border bg-card p-8 md:p-10">
          <div className="grid items-center gap-8 md:grid-cols-[1fr_1.5fr]">
            <div className="flex items-center gap-3">
              <HeroIcon className="size-10 shrink-0 text-primary" />
              <div>
                <h3 className="text-xl font-semibold">{heroFeature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {heroFeature.description}
                </p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
              {heroFeature.why}
            </p>
          </div>
        </div>

        {/* Remaining features — compact 2-column grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          {restFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group rounded-xl border p-5 transition-colors hover:bg-muted/50"
              >
                <div className="mb-3 flex items-center gap-3">
                  <Icon className="size-5 shrink-0 text-primary" />
                  <h3 className="font-medium">{feature.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
