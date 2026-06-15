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
  return (
    <section id="features" className="border-t py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            Бизнест хэрэгтэй бүх боломжууд
          </h2>
          <p className="text-muted-foreground">
            Zer нь жижиг дунд бизнесийн үйл ажиллагааг бүрэн дижитал хэлбэрт
            шилжүүлэхэд хэрэгтэй бүх хэрэгслүүдийг санал болгодог.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group rounded-xl border p-6 transition-colors hover:bg-muted/50"
              >
                <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-6" />
                </div>
                <h3 className="mb-2 font-semibold">{feature.title}</h3>
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
