import { Hero } from "@/components/marketing/Hero";
import { Link } from "@/lib/i18n/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

const posts = [
	{
		slug: "welcome-to-zuiio",
		title: { en: "Welcome to Zuiio", mn: "Зуииод тавтай морил" },
		excerpt: {
			en: "Why we're building software for Mongolian businesses, and what we've learned so far.",
			mn: "Яагаад Монголын бизнесүүдэд зориулж программ хангамж бүтээж байгаа тухай.",
		},
		date: "2026-06-15",
		author: "Zuiio Team",
	},
	{
		slug: "getting-started-with-zer",
		title: { en: "Getting Started with Zer", mn: "Зэр-тэй эхлэх" },
		excerpt: {
			en: "A practical walkthrough of Zer's core features — inventory, sales, expenses, and reporting.",
			mn: "Зэр-ийн үндсэн боломжуудтай танилцах — бараа материал, борлуулалт, зарлага, тайлан.",
		},
		date: "2026-05-20",
		author: "Zuiio Team",
	},
];

type Props = {
	params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "BlogPage" });
	return { title: t("title"), description: t("subtitle") };
}

export default async function BlogPage({ params }: Props) {
	const { locale } = await params;
	setRequestLocale(locale);
	const t = await getTranslations("BlogPage");

	return (
		<>
			<Hero title={t("title")} subtitle={t("subtitle")} />
			<section className="mx-auto max-w-3xl px-6 pb-24">
				<div className="space-y-6">
					{posts.map((post) => (
						<Link
							key={post.slug}
							href={`/blog/${post.slug}`}
							className="group relative block rounded-2xl border border-border bg-card p-6 transition-all duration-250 ease-out hover:shadow-card-hover hover:-translate-y-0.5"
						>
							<div className="flex items-center gap-3 text-xs text-muted-foreground">
								<time dateTime={post.date}>{post.date}</time>
								<span aria-hidden="true">&middot;</span>
								<span>{post.author}</span>
							</div>
							<h2
								className="mt-3 text-xl font-semibold tracking-tight transition-colors duration-250"
								style={{ fontFamily: "var(--font-display)" }}
							>
								{post.title[locale as "en" | "mn"] ?? post.title.en}
							</h2>
							<p className="mt-2 text-sm leading-relaxed text-muted-foreground">
								{post.excerpt[locale as "en" | "mn"] ?? post.excerpt.en}
							</p>
							<div className="mt-4 flex items-center gap-1.5 text-sm font-medium text-primary opacity-0 transition-all duration-250 group-hover:opacity-100 group-hover:gap-3">
								{t("read-more")}
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
									<path d="M5 12h14" />
									<path d="m12 5 7 7-7 7" />
								</svg>
							</div>
						</Link>
					))}
				</div>
			</section>
		</>
	);
}
