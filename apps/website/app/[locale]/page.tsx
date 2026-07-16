import { Hero } from "@/components/marketing/Hero";
import { ProductCard } from "@/components/marketing/ProductCard";
import { FeatureSection } from "@/components/marketing/FeatureSection";
import { Testimonial } from "@/components/marketing/Testimonial";
import { PricingCard } from "@/components/marketing/PricingCard";
import { Link } from "@/lib/i18n/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

const features = [
	{ key: "1" },
	{ key: "2" },
	{ key: "3" },
	{ key: "4" },
	{ key: "5" },
	{ key: "6" },
];

const testimonials = [
	{ authorKey: "1", roleKey: "1", quoteKey: "1" },
	{ authorKey: "2", roleKey: "2", quoteKey: "2" },
];

const plans = [
	{ key: "starter", max: 4 },
	{ key: "pro", max: 6, highlighted: true },
	{ key: "enterprise", max: 5 },
];

type Props = {
	params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "HomePage" });
	return {
		title: t("meta-title"),
		description: t("meta-description"),
		alternates: {
			canonical: "/",
			languages: { mn: "/", en: "/en" },
		},
		openGraph: {
			title: "Zuiio",
			description: t("meta-description"),
			locale: locale === "mn" ? "mn_MN" : "en_US",
		},
	};
}

export default async function HomePage({ params }: Props) {
	const { locale } = await params;
	setRequestLocale(locale);
	const t = await getTranslations("HomePage");
	const h = await getTranslations("Hero");

	return (
		<>
			<Hero
				title={h("default-title")}
				subtitle={h("default-subtitle")}
				eyebrow={h("eyebrow")}
				cta={{ label: h("cta-explore"), href: "/products" }}
				secondaryCta={{ label: h("cta-pricing"), href: "/pricing" }}
			/>

		<section className="mx-auto max-w-6xl px-6 pb-16 pt-4">
				<div className="flex flex-col gap-3 text-center mb-12">
					<h2
						className="text-3xl font-semibold tracking-tight md:text-4xl"
						style={{ fontFamily: "var(--font-display)" }}
					>
						{t("our-products")}
					</h2>
					<p className="text-muted-foreground max-w-lg mx-auto">
						{t("products-subtitle")}
					</p>
				</div>
				<div className="grid gap-6 md:grid-cols-2">
					<ProductCard
						name={t("zer-name")}
						tagline={t("zer-tagline")}
						description={t("zer-description")}
						href="/products/zer"
						variant="zer"
					/>
					<ProductCard
						name={t("tolom-name")}
						tagline={t("tolom-tagline")}
						description={t("tolom-description")}
						href="/products/tolom"
						variant="tolom"
					/>
				</div>
			</section>

			<FeatureSection
				title={t("why-title")}
				description={t("why-subtitle")}
				features={features.map((f) => ({
					title: t(`feature-${f.key}-title`),
					description: t(`feature-${f.key}-desc`),
				}))}
			/>

		<section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
			<h2
				className="mb-12 text-3xl font-semibold tracking-tight md:text-4xl"
				style={{ fontFamily: "var(--font-display)" }}
			>
				{t("testimonials-title")}
			</h2>
			<div className="grid gap-6 md:grid-cols-2">
				{testimonials.map((tst) => (
					<Testimonial
						key={tst.authorKey}
						quote={t(`testimonial-${tst.quoteKey}-quote`)}
						author={t(`testimonial-${tst.authorKey}-author`)}
						role={t(`testimonial-${tst.roleKey}-role`)}
					/>
				))}
			</div>
		</section>

		<section id="pricing" className="border-y border-border" style={{ backgroundColor: "var(--color-muted)" }}>
			<div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
				<h2
					className="mb-4 text-center text-3xl font-semibold tracking-tight md:text-4xl"
					style={{ fontFamily: "var(--font-display)" }}
				>
					{t("pricing-title")}
				</h2>
				<p className="mx-auto mb-12 max-w-lg text-center text-muted-foreground">
					{t("pricing-subtitle")}
				</p>
				<div className="grid gap-6 md:grid-cols-3">
					{plans.map((plan) => (
						<PricingCard
							key={plan.key}
							name={t(`${plan.key}-name`)}
							price={t(`${plan.key}-price`)}
							description={t(`${plan.key}-desc`)}
							features={[...Array(plan.max)]
								.map((_, i) => t(`${plan.key}-feature-${i + 1}`))
								.filter(Boolean)}
							highlighted={plan.highlighted}
							ctaLabel={t("cta-button")}
						/>
					))}
				</div>
			</div>
		</section>

		<section className="mx-auto max-w-6xl px-6 pb-24 pt-16 md:pt-24">
			<div
				className="relative isolate overflow-hidden rounded-2xl px-6 py-16 text-center md:py-20"
				style={{
					backgroundColor: "var(--color-card)",
					border: "1px solid var(--color-border)",
				}}
			>
				<div
					className="pointer-events-none absolute -inset-32 -z-10 opacity-40"
					style={{
						background:
							"radial-gradient(ellipse 60% 50% at 50% 50%, var(--brand-violet-glow), transparent)",
					}}
					aria-hidden="true"
				/>
				<h2
					className="text-3xl font-semibold tracking-tight md:text-4xl"
					style={{ fontFamily: "var(--font-display)" }}
				>
					{t("cta-title")}
				</h2>
				<p className="mx-auto mt-4 max-w-lg text-muted-foreground">
					{t("cta-subtitle")}
				</p>
				<div className="mt-8 flex flex-wrap items-center justify-center gap-4">
					<Link href="/pricing" className="btn-primary">
						{t("cta-button")}
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2.5"
							strokeLinecap="round"
							strokeLinejoin="round"
							aria-hidden="true"
						>
							<path d="M5 12h14" />
							<path d="m12 5 7 7-7 7" />
						</svg>
					</Link>
					<Link href="/about" className="btn-secondary">
						{t("cta-secondary")}
					</Link>
				</div>
			</div>
		</section>
		</>
	);
}
