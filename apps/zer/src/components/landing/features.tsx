"use client";

import {
  Calculator,
  ChartBar,
  Clock,
  CreditCard,
  CurrencyDollar,
  FileText,
  IdentificationBadge,
  MagicWand,
  Package,
  Robot,
  Sparkle,
  Storefront,
  Trolley,
  Users,
  Warehouse,
} from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";
import { cn } from "@/lib/utils";

const companyTypes = [
  { value: "all", label: "Бүгд" },
  { value: "retail", label: "Жижиглэн худалдаа" },
  { value: "wholesale", label: "Бөөний худалдаа" },
  { value: "service", label: "Үйлчилгээ" },
  { value: "manufacturing", label: "Үйлдвэрлэл" },
  { value: "restaurant", label: "Ресторан" },
  { value: "gym", label: "Фитнес" },
  { value: "religious", label: "Шашны дэлгүүр" },
] as const;

type OrgType = (typeof companyTypes)[number]["value"];

const categoryConfig: Record<string, { label: string; className: string }> = {
  inventory: {
    label: "Бараа материал",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  sales: {
    label: "Борлуулалт",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  purchases: {
    label: "Худалдан авалт",
    className:
      "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  },
  finance: {
    label: "Санхүү",
    className:
      "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  },
  analytics: {
    label: "Аналитик",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  crm: {
    label: "Харилцагч",
    className:
      "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  },
  manufacturing: {
    label: "Үйлдвэрлэл",
    className:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  },
  hr: {
    label: "Хүний нөөц",
    className:
      "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  },
  online: {
    label: "Онлайн",
    className:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  },
  ai: {
    label: "Хиймэл оюун ухаан",
    className:
      "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-400",
  },
};

const features = [
  {
    icon: Package,
    title: "Бараа материалын бүртгэл",
    category: "inventory",
    description:
      "Бүтээгдэхүүн, ангилал, нэгжийн бүртгэл. Олон агуулах, үлдэгдэл хөдөлгөөн, тохируулга, дахин захиалга, үнийн түүх, баркод.",
    why: "Бараа материалаа бүрэн хянаж, тооллого автоматжуулж, бодит үлдэгдлийг мэдэж, дуусах дөхсөн бараагаа дахин захиалаарай.",
    orgTypes: [
      "retail",
      "wholesale",
      "manufacturing",
      "restaurant",
      "religious",
    ],
  },
  {
    icon: CurrencyDollar,
    title: "Борлуулалт ба касс",
    category: "sales",
    description:
      "POS касс, борлуулалтын баримт, буцаалт, нэхэмжлэх. Карт, бэлэн, шилжүүлэг — бүх төлбөрийн хэлбэр.",
    why: "Худалдагч нар хурдан POS ашиглаж, баримт хэвлэж, төлбөр хүлээн авна. Борлуулалт бүр автомат бүртгэгдэнэ.",
    orgTypes: ["retail", "wholesale", "restaurant", "religious"],
  },
  {
    icon: Trolley,
    title: "Худалдан авалт",
    category: "purchases",
    description:
      "Нийлүүлэгчээс бараа авах захиалга, баримт бүртгэл. Нийлүүлэгчийн мэдээлэл, түүх, үнийн харьцуулалт.",
    why: "Худалдан авалтаа бүртгэж, нийлүүлэгчидтэй хийсэн бүх гүйлгээг нэг дор хянаж, өр төлбөрөө хянаарай.",
    orgTypes: [
      "retail",
      "wholesale",
      "manufacturing",
      "restaurant",
      "gym",
      "religious",
    ],
  },
  {
    icon: CreditCard,
    title: "Зарлагын бүртгэл",
    category: "finance",
    description:
      "Зарлагын төрөл, дүн, огноогоор бүртгэх. Сарын зарлагын тайлан, өмнөх саруудтай харьцуулалт.",
    why: "Зарлагаа ангилж, хянаж, сар бүр тайлан гаргаж, зардлаа бууруулах боломжийг олж харна.",
    orgTypes: [
      "retail",
      "wholesale",
      "service",
      "manufacturing",
      "restaurant",
      "gym",
      "religious",
    ],
  },
  {
    icon: Calculator,
    title: "Нягтлан бодох бүртгэл",
    category: "finance",
    description:
      "Ерөнхий журнал, дансны тэнцэл, санхүүгийн тайлан. Автомат бичилт, татварын тайлангийн бэлтгэл.",
    why: "Санхүүгийн бүртгэлээ нэгдсэн системд хөтлөж, журнал, тэнцлэгээ хялбархан гаргаж авна.",
    orgTypes: ["retail", "wholesale", "manufacturing", "service"],
  },
  {
    icon: FileText,
    title: "Баримт бичиг",
    category: "finance",
    description:
      "Нэхэмжлэх, үнийн санал, хямдрал, комисс. Баримт бүрийг үүсгэж, хэвлэж, имэйлээр илгээх.",
    why: "Бүх төрлийн баримт бичгээ нэг системээс үүсгэж, харилцагчдад илгээж, төлөв байдлыг хянаарай.",
    orgTypes: ["retail", "wholesale", "service", "manufacturing"],
  },
  {
    icon: ChartBar,
    title: "Тайлан ба шинжилгээ",
    category: "analytics",
    description:
      "Борлуулалт, зарлага, ашиг, үлдэгдлийн тайлан. График, диаграммаар харах, PDF экспорт, харьцуулалт.",
    why: "Бизнесийн гол үзүүлэлтүүдийг харж, борлуулалтын чиг хандлага, ашиг орлогоо дүн шинжилгээ хийгээд шийдвэр гарга.",
    orgTypes: [
      "retail",
      "wholesale",
      "service",
      "manufacturing",
      "restaurant",
      "gym",
      "religious",
    ],
  },
  {
    icon: Users,
    title: "Харилцагчийн менежмент",
    category: "crm",
    description:
      "Харилцагч, нийлүүлэгчийн дэлгэрэнгүй мэдээлэл, түүх, өглөг/авлагын хяналт, үнийн санал.",
    why: "Харилцагчдын өглөг авлагыг бодит цаг хугацаанд хянаж, үлдэгдэл, төлбөрийн хугацааг санаж яв.",
    orgTypes: ["retail", "wholesale", "service", "gym"],
  },
  {
    icon: Warehouse,
    title: "Агуулах ба салбар",
    category: "inventory",
    description:
      "Олон агуулах, салбар хооронд үлдэгдэл хөдөлгөөн, тохируулга. Салбар бүр өөрийн үнийн бодлоготой.",
    why: "Олон салбар, агуулахтай бол үлдэгдлээ төвлөрүүлэн хянаж, салбар хооронд бараа шилжүүлэх.",
    orgTypes: ["retail", "wholesale"],
  },
  {
    icon: Clock,
    title: "Үйлдвэрлэлийн удирдлага",
    category: "manufacturing",
    description:
      "BOM (материалын жагсаалт), үйлдвэрлэлийн захиалга, чанарын хяналт, зардал тооцоо, материалын хяналт.",
    why: "Үйлдвэрлэлийн процессоо бүрэн дижитал болгож, материалын зарцуулалт, чанар, зардлаа хянаарай.",
    orgTypes: ["manufacturing"],
  },
  {
    icon: IdentificationBadge,
    title: "Хүний нөөц ба цалин",
    category: "hr",
    description:
      "Ажилтны бүртгэл, цалингийн тооцоо, комисс, урамшуулал. Ажилтан бүрийн цалингийн түүх.",
    why: "Ажилтнуудын мэдээлэл, цалинг нэгдсэн системд хөтөлж, цалингийн хуудас автомат гаргах.",
    orgTypes: ["service", "manufacturing", "gym"],
  },
  {
    icon: Storefront,
    title: "Онлайн дэлгүүр",
    category: "online",
    description:
      "Өөрийн брэндинг онлайн дэлгүүр, сагс, захиалга, төлбөрийн баримт. Үйлчлүүлэгчид өөрсдөө захиалах.",
    why: "Өөрийн брэндинг дэлгүүрээ нээж, үйлчлүүлэгчид тань цаг хугацаанаас үл хамааран захиалга өгөх боломжтой.",
    orgTypes: ["retail", "gym", "religious"],
  },
  {
    icon: Robot,
    title: "AI Туслах — Telegram бот",
    category: "ai",
    description:
      "Борлуулалт, үлдэгдэл, зарлага, ашгийн талаар байгалийн хэлээр асуулт асуугаад Telegram-аас шууд хариу авах. AI таны өгөгдөлд тулгуурлан хариулна.",
    why: "Хаана ч байсан Telegram нээгээд 'Өчигдөр хэдэн төгрөгийн борлуулалт хийв?' гэх мэт асуултаа асуугаад хариу авна.",
    orgTypes: [
      "retail",
      "wholesale",
      "service",
      "manufacturing",
      "restaurant",
      "gym",
      "religious",
    ],
  },
  {
    icon: Sparkle,
    title: "Автомат өдрийн тайлан",
    category: "ai",
    description:
      "Өдөр бүрийн эцэст борлуулалт, зарлага, гол үзүүлэлтүүдийн AI-генерилсэн дүгнэлт Telegram-д ирнэ. Гараар тайлан гаргах шаардлагагүй.",
    why: "Ажлын өдөр дуусмагц борлуулалт, зардлын хураангуйг Telegram-аар хүлээн авч, бизнесийн үр дүнгээ мэдэж байх.",
    orgTypes: [
      "retail",
      "wholesale",
      "service",
      "manufacturing",
      "restaurant",
      "gym",
      "religious",
    ],
  },
  {
    icon: MagicWand,
    title: "Ухаалаг ангилал ба дүн шинжилгээ",
    category: "ai",
    description:
      "Зарлагын тодорхойлолтыг AI автоматаар ангилж, тохирох зарлагын төрөлд оруулна. Байгалийн хэлээр асуулт асуугаад тайлан гаргуулах.",
    why: "Зарлага бүртгэхэд төрлийг гараар сонгохгүй, AI өөрөө тааруулж ангилна. Мөн 'Аль бараа хамгийн их борлогдож байна?' гэж асуугаад хариу авах.",
    orgTypes: [
      "retail",
      "wholesale",
      "service",
      "manufacturing",
      "restaurant",
      "gym",
      "religious",
    ],
  },
];

export function Features() {
  const [selectedOrg, setSelectedOrg] = useState<OrgType>("all");

  const visibleFeatures =
    selectedOrg === "all"
      ? features
      : features.filter((f) => f.orgTypes.includes(selectedOrg));

  const [heroFeature, ...restFeatures] = visibleFeatures;
  const HeroIcon = heroFeature?.icon;

  return (
    <section
      id="features"
      className="relative overflow-hidden border-t py-20 md:py-28"
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute right-0 top-1/3 h-72 w-72 -translate-y-1/2 rounded-full bg-primary/[0.03] blur-[100px]" />
      </div>

      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-10 max-w-2xl">
          <p className="mb-3 text-xs font-medium uppercase tracking-widest text-primary">
            Онцлогууд
          </p>
          <h2 className="mb-4 font-display text-4xl leading-tight text-balance md:text-5xl">
            Бизнест хэрэгтэй бүх боломжууд
          </h2>
          <p className="text-pretty text-base text-muted-foreground md:text-lg">
            Zer нь жижиг дунд бизнесийн үйл ажиллагааг бүрэн дижитал хэлбэрт
            шилжүүлэхэд хэрэгтэй бүх хэрэгслүүдийг санал болгодог.
          </p>
        </div>

        {/* Org type filter pills */}
        <div className="mb-10 flex flex-wrap items-center gap-2">
          {companyTypes.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => setSelectedOrg(type.value)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-xs font-medium transition-all duration-200",
                selectedOrg === type.value
                  ? "border-primary/40 bg-primary/10 text-primary shadow-sm"
                  : "border-border/60 bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground",
              )}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Hero feature */}
        {heroFeature && (
          <div className="group relative mb-10 overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-card to-muted/30 p-8 shadow-lg md:p-10">
            <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-gradient-to-bl from-violet-500/10 to-transparent blur-2xl" />

            <div className="relative grid items-center gap-8 md:grid-cols-[auto_1fr]">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
                <HeroIcon className="size-8 shrink-0 text-primary" />
              </div>
              <div>
                <div className="mb-2 flex items-center gap-2">
                  {heroFeature.category &&
                    (() => {
                      const cfg = categoryConfig[heroFeature.category];
                      return cfg ? (
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-[11px] font-medium leading-none",
                            cfg.className,
                          )}
                        >
                          {cfg.label}
                        </span>
                      ) : null;
                    })()}
                  <h3 className="text-xl font-semibold">{heroFeature.title}</h3>
                </div>
                <p className="mb-3 text-sm leading-relaxed text-muted-foreground md:text-base">
                  {heroFeature.description}
                </p>
                <p className="text-sm leading-relaxed text-primary/80">
                  {heroFeature.why}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Features grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {restFeatures.length > 0 ? (
            restFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group relative overflow-hidden rounded-xl border border-border/50 bg-card p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover"
                >
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-violet-500/0 via-primary/40 to-teal-500/0 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

                  <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                    <Icon className="size-5" />
                  </div>
                  <div className="mb-3 flex items-center gap-2">
                    <h3 className="font-semibold">{feature.title}</h3>
                    {feature.category &&
                      (() => {
                        const cfg = categoryConfig[feature.category];
                        return cfg ? (
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-medium leading-none",
                              cfg.className,
                            )}
                          >
                            {cfg.label}
                          </span>
                        ) : null;
                      })()}
                  </div>
                  <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                  <p className="text-xs leading-relaxed text-primary/70">
                    {feature.why}
                  </p>
                </div>
              );
            })
          ) : (
            <p className="col-span-full py-10 text-center text-sm text-muted-foreground">
              Энэ төрлийн байгууллагад тохирох онцлогуудыг удахгүй нэмнэ.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
