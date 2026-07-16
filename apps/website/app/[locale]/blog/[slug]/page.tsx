import { Link } from "@/lib/i18n/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

const postSlugs = [
	"welcome-to-zuiio",
	"getting-started-with-zer",
	"why-mongolian-businesses-need-local-software",
];

type Props = {
	params: Promise<{ slug: string; locale: string }>;
};

export async function generateMetadata({ params }: Props) {
	const { locale, slug } = await params;
	const postIndex = postSlugs.indexOf(slug);
	if (postIndex === -1) return { title: "Not Found" };
	const t = await getTranslations({ locale, namespace: "BlogPage" });
	return { title: t(`post-${postIndex + 1}-title`) };
}

export default async function BlogPostPage({ params }: Props) {
	const { locale, slug } = await params;
	setRequestLocale(locale);
	const t = await getTranslations("BlogPage");

	const postIndex = postSlugs.indexOf(slug);

	if (postIndex === -1) {
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

	const i = postIndex + 1;
	const title = t(`post-${i}-title`);
	const content = t(`post-${i}-content`);

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
