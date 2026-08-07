export interface DocsNavItem {
  href: string;
  label: string;
}

export interface DocsNavGroup {
  label: string;
  items: DocsNavItem[];
}

export const DOCS_NAV: DocsNavGroup[] = [
  {
    label: "Эхлэх",
    items: [
      { href: "/docs", label: "Ерөнхий танилцуулга" },
      { href: "/docs/vision", label: "Бүтээгдэхүүний алсын хараа" },
      { href: "/docs/architecture", label: "Архитектур" },
      { href: "/docs/roadmap", label: "Замын зураг" },
    ],
  },
  {
    label: "Дизайн систем",
    items: [{ href: "/docs/design", label: "Брэнд ба дизайн систем" }],
  },
  {
    label: "Фичерүүд",
    items: [{ href: "/docs/features", label: "Фичерийн бүртгэл" }],
  },
];
