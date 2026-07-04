import { defineConfig } from "vitepress";

const siteUrl = "https://docs.tamga.app";

export default defineConfig({
	title: "Tamga",
	description:
		"Тамга — Морины менежментийн апп. Захиалга, маркетинг, техник багийн нэгдсэн баримт бичиг.",
	lang: "mn-MN",
	cleanUrls: true,
	ignoreDeadLinks: true,
	lastUpdated: true,
	markdown: { lineNumbers: true },
	sitemap: {
		hostname: siteUrl,
	},

	head: [
		["link", { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }],
		["meta", { property: "og:type", content: "website" }],
		["meta", { property: "og:title", content: "Tamga Docs" }],
		[
			"meta",
			{
				property: "og:description",
				content: "Морины тань цорын ганц үнэн эх сурвалж — баримт бичиг.",
			},
		],
		["meta", { property: "og:url", content: siteUrl }],
		["meta", { name: "twitter:card", content: "summary_large_image" }],
		["meta", { name: "twitter:title", content: "Tamga Docs" }],
		[
			"meta",
			{ name: "viewport", content: "width=device-width, initial-scale=1.0" },
		],
		["meta", { name: "theme-color", content: "#F06A2E" }],
	],

	themeConfig: {
		nav: [
			{ text: "Нүүр", link: "/" },
			{ text: "Бүтээгдэхүүн", link: "/product/" },
			{ text: "Зах зээл", link: "/market/" },
			{ text: "Санхүү", link: "/business/finance" },
			{ text: "Техник", link: "/tech/architecture" },
		],

		sidebar: [
			// ── Бүтээгдэхүүн ──
			{
				text: "Бүтээгдэхүүн",
				collapsed: false,
				items: [
					{ text: "Тойм", link: "/product/" },
					{ text: "Үнийн стратеги", link: "/product/pricing" },
					{ text: "Замын зураг", link: "/product/roadmap" },
					{ text: "Хэрэглэгчийн идэвх", link: "/product/engagement" },
				],
			},

			// ── Зах зээл & Маркетинг ──
			{
				text: "Зах зээл & Маркетинг",
				collapsed: false,
				items: [
					{ text: "Стратеги", link: "/market/" },
					{ text: "Өрсөлдөгч анализ", link: "/market/competitor" },
					{ text: "App Store", link: "/market/store-listing" },
					{ text: "Store metadata", link: "/market/store-metadata" },
				],
			},

			// ── Санхүү & Эрх зүй ──
			{
				text: "Санхүү & Эрх зүй",
				collapsed: false,
				items: [
					{ text: "Санхүү", link: "/business/finance" },
					{ text: "Эрх зүй", link: "/business/legal" },
					{ text: "Нууцлал", link: "/business/privacy" },
				],
			},

			// ── Функциуд ──
			{
				text: "Функциуд",
				collapsed: false,
				items: [
					{ text: "Бүх функциуд", link: "/features/" },
					{ text: "Эрэл хайгуул", link: "/features/lost-horse" },
					{ text: "Удам судалгаа", link: "/features/lineage/" },
					{ text: "  Бизнес", link: "/features/lineage/business-rules" },
					{ text: "  Урсгал", link: "/features/lineage/user-flows" },
					{ text: "  Сценариуд", link: "/features/lineage/scenarios" },
					{ text: "  Шийдвэрүүд", link: "/features/lineage/decisions" },
					{ text: "  Техник", link: "/features/lineage/technical-notes" },
					{ text: "  Төлөв & Gap", link: "/features/lineage/gap-analysis" },
				],
			},

			// ── Дизайн ──
			{
				text: "Дизайн",
				collapsed: true,
				items: [
					{ text: "Дизайн систем", link: "/design/" },
					{ text: "Өнгөний палитра", link: "/design/palette" },
					{ text: "Онбордын загвар", link: "/design/onboarding" },
				],
			},

			// ── Техник хангамж ──
			{
				text: "Техник хангамж",
				collapsed: true,
				items: [
					{ text: "Архитектур", link: "/tech/architecture" },
					{ text: "Технологи", link: "/tech/tech-stack" },
					{ text: "Өгөгдлийн сан", link: "/tech/database" },
					{ text: "Спринт төлөвлөгөө", link: "/tech/sprint-plan" },
				],
			},
		],

		search: {
			provider: "local",
			options: {
				translations: {
					button: { buttonText: "Хайх", buttonAriaLabel: "Хайх" },
					modal: {
						noResultsText: "Үр дүн олсонгүй",
						resetButtonTitle: "Хайлт цэвэрлэх",
						footer: {
							selectText: "сонгох",
							navigateText: "rowsable",
							closeText: "хаах",
						},
					},
				},
			},
		},

		editLink: {
			pattern: "https://github.com/themuuln/tamga/edit/main/docs/:path",
			text: "Энэ хуудсыг засах",
		},

		lastUpdated: {
			text: "Сүүлд шинэчлэсэн",
		},

		outline: {
			level: [2, 3],
			label: "Агуулга",
		},

		docFooter: {
			prev: "Өмнөх",
			next: "Дараах",
		},

		socialLinks: [
			{ icon: "github", link: "https://github.com/themuuln/tamga" },
		],
	},
});
