import { defineConfig } from "vitepress";

export default defineConfig({
  lang: "mn-MN",
  title: "TOLOM — Гарын авлага",
  description: "TOLOM авто засварын удирдлагын систем — хэрэглэгчийн гарын авлага",
  base: "/guide/",
  outDir: "../public/guide",
  cleanUrls: true,
  lastUpdated: true,

  head: [
    ["meta", { name: "theme-color", content: "#09090b" }],    ["meta", { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" }],
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
          { text: "Нэршил", link: "/nershil" },
        ],
      },
      {
        text: "Үндсэн хэсгүүд",
        items: [
          { text: "Хяналтын самбар", link: "/dashboard" },
          { text: "Засварын булан", link: "/bay-view" },
          { text: "Ажлын захиалга", link: "/work-orders" },
          { text: "Харилцагчид", link: "/customers" },
          { text: "Тээврийн хэрэгсэл", link: "/vehicles" },
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
          { text: "Тайлан", link: "/reports" },
        ],
      },
      {
        text: "Тохиргоо",
        items: [
          { text: "Системийн тохиргоо", link: "/settings" },
          { text: "Байгууллагын удирдлага", link: "/organization" },
          { text: "Нөөц, экспорт", link: "/backup" },
        ],
      },
      {
        text: "Бусад",
        items: [
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
