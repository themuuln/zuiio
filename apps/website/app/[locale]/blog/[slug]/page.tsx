import { Link } from "@/lib/i18n/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

const posts: Record<
	string,
	{ title: Record<string, string>; content: Record<string, string> }
> = {
	"welcome-to-zuiio": {
		title: { en: "Welcome to Zuiio", mn: "Зуииод тавтай морил" },
		content: {
			en: "We started Zuiio because we saw Mongolian businesses struggling with software built for other markets.\n\nInventory systems that weren't designed for Mongolian small businesses. Sales tools that didn't work offline. Auto repair software that had never seen a ger district delivery route.\n\nWe're building differently.\n\n**Built for Mongolia, from day one.** Every feature, every form, every workflow — it's all designed for the way Mongolian businesses actually work. Not adapted after the fact.\n\n**Offline first.** Internet in Mongolia isn't always reliable. Your software shouldn't stop working when the connection drops. All our products work offline and sync when you reconnect.\n\n**One brand, two products.** Zer is a mini ERP for SMEs — inventory, sales, expenses, customers, and reports. Tolom manages auto repair shops — bay view, work orders, parts, estimates, and mechanics. They share the same design, the same philosophy.\n\nThis is just the beginning. We'll be sharing more about what we're building, how we build it, and what we learn along the way.\n\n— The Zuiio Team",
			mn: "Бид Зуиио-г Монголын бизнесүүд өөр зах зээлд зориулж бүтээсэн программ хангамжтай тэмцэж буйг хараад эхлүүлсэн.\n\nМонголын жижиг бизнесүүдэд зориулагдаагүй бараа материалын системүүд. Интернетгүй ажилладаггүй борлуулалтын хэрэгслүүд. Гэрийн хаягтай авто засварын программ хангамж.\n\nБид өөрөөр бүтээж байна.\n\n**Монголд зориулсан, эхний өдрөөс.** Боломж бүр, форм бүр, ажлын урсгал бүр — Монголын бизнесүүд хэрхэн ажилладагийг харгалзан зохион бүтээгдсэн.\n\n**Интернетгүй ажилладаг.** Монголд интернет хаа сайгүй байхгүй. Таны программ холбоо тасархад зогсох ёсгүй.\n\n**Нэг брэнд, хоёр бүтээгдэхүүн.** Зэр нь ЖДҮ-д зориулсан мини ERP. Толом нь авто засварын газруудыг удирдана. Хоёулаа ижил дизайн, ижил философитой.\n\nЭнэ бол зөвхөн эхлэл. Бид бүтээж буй зүйлээ, хэрхэн бүтээж буйгаа, замдаа суралцаж буй зүйлээ хуваалцах болно.\n\n— Зуиио Баг",
		},
	},
	"getting-started-with-zer": {
		title: { en: "Getting Started with Zer", mn: "Зэр-тэй эхлэх" },
		content: {
			en: "Zer is a mini ERP built for Mongolian small and medium businesses. Here's what you can do from day one.\n\n**Inventory & Stock Management**\n\nTrack products, categories, units, and stock levels in real time. Zer gives you automatic stock counts, product codes, price history, and low-stock alerts so you always know what's on your shelves.\n\n**Sales with POS**\n\nCreate sales with multi-line entry, customer selection, and payment tracking. The Shop POS module gives you a product catalog, cart, checkout with numeric keypad, and receipt printing — perfect for retail.\n\n**Expense Tracking**\n\nLog expenses by category, amount, date, and payment method. Get monthly expense reports with comparisons and CSV export.\n\n**Customer & Supplier Management**\n\nStore detailed profiles with contact info, balance tracking, and full transaction history for both customers and suppliers.\n\n**Reports & Analytics**\n\nSales, expense, and profit reports with charts and graphs. Date range filtering, CSV export, and public share links that don't require login.\n\n**Multi-Branch Support**\n\nManage multiple physical locations with isolated transactions per branch. Get a consolidated accounting view across all branches.\n\nReady to get started? Create your free account and start tracking your business today.",
			mn: "Зэр бол Монголын жижиг дунд бизнесүүдэд зориулсан мини ERP юм. Эхний өдрөөс хийж болох зүйлс:\n\n**Бараа материалын бүртгэл**\n\nБүтээгдэхүүн, ангилал, нэгж, нөөцийн түвшинг бодит цаг хугацаанд хянах. Автомат тооллого, барааны код, үнийн түүх, нөөц багатай үед сануулах.\n\n**Борлуулалт POS-той**\n\nОлон мөрт борлуулалт, харилцагч сонголт, төлбөрийн хяналт. POS модуль: каталог, сагс, тоон гартай төлбөр тооцоо, баримт хэвлэх.\n\n**Зарлагын бүртгэл**\n\nЗарлагыг төрөл, дүн, огноо, төлбөрийн хэлбэрээр бүртгэх. Сарын тайлан, харьцуулалт, CSV экспорт.\n\n**Харилцагч, ханган нийлүүлэгчийн бүртгэл**\n\nХарилцагч болон ханган нийлүүлэгчдийн дэлгэрэнгүй мэдээлэл, үлдэгдлийн хяналт, гүйлгээний түүх.\n\n**Тайлан ба аналитик**\n\nБорлуулалт, зарлага, ашгийн тайлан график, диаграммаар. Огнооны шүүлтүүр, CSV экспорт, нийтийн холбоос.\n\n**Олон салбар дэмжих**\n\nОлон салбарыг тусдаа гүйлгээтэй удирдах. Нэгдсэн нягтлан бодох бүртгэлийн харагдац.\n\nӨнөөдөр эхлэхэд бэлэн үү? Үнэгүй бүртгүүлж, бизнесээ хянаж эхлээрэй.",
		},
	},
};

type Props = {
	params: Promise<{ slug: string; locale: string }>;
};

export async function generateMetadata({ params }: Props) {
	const { locale, slug } = await params;
	const post = posts[slug];
	if (!post) return { title: "Not Found" };
	return { title: post.title[locale] ?? post.title.en };
}

export default async function BlogPostPage({ params }: Props) {
	const { locale, slug } = await params;
	setRequestLocale(locale);
	const t = await getTranslations("BlogPage");
	const post = posts[slug];

	if (!post) {
		return (
			<div className="mx-auto max-w-3xl px-6 py-24 text-center">
				<h1
					className="text-3xl font-semibold tracking-tight"
					style={{ fontFamily: "var(--font-display)" }}
				>
					{t("post-not-found")}
				</h1>
				<Link href="/blog" className="btn-secondary mt-6 inline-flex">
					<svg
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
						aria-hidden="true"
					>
						<path d="m12 19-7-7 7-7" />
						<path d="M19 12H5" />
					</svg>
					{t("back-to-blog")}
				</Link>
			</div>
		);
	}

	const title = post.title[locale] ?? post.title.en;
	const content = post.content[locale] ?? post.content.en;

	return (
		<article className="mx-auto max-w-3xl px-6 py-16">
			<Link href="/blog" className="btn-secondary inline-flex text-sm">
				<svg
					width="14"
					height="14"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
					aria-hidden="true"
				>
					<path d="m12 19-7-7 7-7" />
					<path d="M19 12H5" />
				</svg>
				{t("back-to-blog")}
			</Link>
			<h1
				className="mt-8 text-3xl font-semibold tracking-tight md:text-4xl"
				style={{ fontFamily: "var(--font-display)" }}
			>
				{title}
			</h1>
			<div className="mt-10 space-y-4 text-base leading-relaxed text-foreground/90 whitespace-pre-line">
				{content}
			</div>
		</article>
	);
}
