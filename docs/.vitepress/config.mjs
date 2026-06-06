import { defineConfig } from "vitepress";

export default defineConfig({
  lang: "mn-MN",
  title: "TOLOM — Гарын авлага",
  description:
    "TOLOM авто засварын удирдлагын систем — хэрэглэгчийн гарын авлага",
  base: "/guide/",
  outDir: "../public/guide",
  cleanUrls: true,
  lastUpdated: true,

  head: [
    ["meta", { name: "theme-color", content: "#09090b" }],
    [
      "meta",
      {
        name: "apple-mobile-web-app-status-bar-style",
        content: "black-translucent",
      },
    ],
    ["link", { rel: "icon", href: "/favicon.ico" }],
  ],

  themeConfig: {
    logo: "/tolom-icon.svg",

    nav: [
      { text: "Эхлэл", link: "/" },
      { text: "Гарын авлага", link: "/intro" },
    ],

    sidebar: [
      {
        text: "Эхлэх",
        items: [
          { text: "Танилцуулга", link: "/intro" },
          { text: "Системд нэвтрэх", link: "/getting-started" },
          { text: "Архитектур", link: "/architecture/index" },
          { text: "Нэршил", link: "/nershil" },
        ],
      },
      {
        text: "Үндсэн хэсгүүд",
        items: [
          { text: "Хяналтын самбар", link: "/dashboard" },
          { text: "Засварын булан", link: "/bay-view" },
          { text: "Механикийн самбар", link: "/mechanic" },
          { text: "Механикийн гүйцэтгэл", link: "/mechanic-performance" },
          { text: "Ажлын захиалга", link: "/work-orders" },
          { text: "Үнэлгээ", link: "/estimates" },
          { text: "Цаг товлолт", link: "/appointments" },
          { text: "Харилцагчид", link: "/customers" },
          { text: "Тээврийн хэрэгсэл", link: "/vehicles" },
          { text: "Өдрийн хаалт", link: "/eod-close" },
        ],
      },
      {
        text: "Үйлчилгээ, сэлбэг",
        items: [
          { text: "Үйлчилгээний каталог", link: "/services" },
          { text: "Автомашины загвар", link: "/vehicle-models" },
        ],
      },
      {
        text: "Бараа, санхүү",
        items: [
          { text: "Бараа материал", link: "/inventory" },
          { text: "Санхүү", link: "/finance" },
          { text: "Зарлагын бүртгэл", link: "/expenses" },
          { text: "Тайлан", link: "/reports" },
        ],
      },
      {
        text: "Үйлчилгээний сануулга",
        items: [
          { text: "Үйлчилгээний сануулга", link: "/service-reminders" },
          { text: "Telegram Bot", link: "/telegram-bot" },
        ],
      },
      {
        text: "Тохиргоо",
        items: [
          { text: "Системийн тохиргоо", link: "/settings" },
          { text: "Байгууллагын удирдлага", link: "/organization" },
          { text: "Үнийн дүрмүүд", link: "/pricing-rules" },
          { text: "Нөөц, экспорт", link: "/backup" },
          { text: "Алсын синхрончлол", link: "/sync" },
        ],
      },
      {
        text: "Харилцагчийн портал",
        items: [{ text: "Портал", link: "/portal" }],
      },
      {
        text: "Бусад",
        items: [
          { text: "Админ", link: "/admin" },
          { text: "QR Цаг бүртгэл", link: "/qr-clock-in" },
          { text: "Интеграцууд", link: "/integrations" },
          { text: "Зөвлөмжүүд", link: "/tips" },
        ],
      },
    ],

    socialLinks: [
      { icon: "github", link: "https://github.com/themuuln/tolom" },
    ],

    footer: {
      message: "TOLOM — Авто засварын удирдлагын систем",
      copyright: "© 2026 TOLOM. Бүх эрх хуулиар хамгаалагдсан.",
    },

    editLink: {
      pattern: "https://github.com/themuuln/tolom/edit/main/docs/:path",
      text: "Энэ хуудсыг GitHub дээр засах",
    },

    search: {
      provider: "local",
    },
  },
});
