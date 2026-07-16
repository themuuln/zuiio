import { Hero } from "@/components/marketing/Hero";
import { Link } from "@/lib/i18n/navigation";
import { ProductJsonLd } from "@/components/marketing/ProductJsonLd";
import { getTranslations, setRequestLocale } from "next-intl/server";

const features = [
	{ key: "1" },
	{ key: "2" },
	{ key: "3" },
	{ key: "4" },
	{ key: "5" },
	{ key: "6" },
];

const featIcons = [
	<svg key="a" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true"><path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" /></svg>,
	<svg key="b" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
	<svg key="c" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></svg>,
	<svg key="d" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>,
	<svg key="e" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true"><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" /></svg>,
	<svg key="f" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>,
];

type Props = {
	params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "TumurchPage" });
	return { title: `${t("title")} — Gym Management`, description: t("subtitle") };
}

export default async function TumurchProductPage({ params }: Props) {
	const { locale } = await params;
	setRequestLocale(locale);
	const t = await getTranslations("TumurchPage");

	return (
		<>
			<Hero
				title={t("title")}
				subtitle={t("subtitle")}
				cta={{ label: t("cta"), href: "/pricing" }}
				secondaryCta={{ label: "Learn more…", href: "#features" }}
			/>
			<section id="features" className="reveal mx-auto max-w-6xl px-6 pb-24">
				<div className="mx-auto max-w-2xl text-center mb-16">
					<h2 className="text-3xl font-semibold tracking-tight md:text-4xl" style={{ fontFamily: "var(--font-display)" }}>
						{t("features-title")}
					</h2>
					<p className="mt-4 text-lg text-muted-foreground">{t("features-subtitle")}</p>
				</div>
				<div className="grid gap-5 md:grid-cols-3 md:grid-rows-2">
					<div className="bento-cell col-span-1 md:col-span-2 md:row-span-2 flex flex-col justify-center p-8">
						<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: "var(--brand-violet-glow)", color: "var(--color-primary)" }}>
							{featIcons[0]}
						</div>
						<h3 className="text-xl font-semibold md:text-2xl">{t("feature-1-title")}</h3>
						<p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground md:text-base">{t("feature-1-desc")}</p>
					</div>
					{features.slice(1).map((f, i) => (
						<div key={f.key} className="bento-cell flex flex-col justify-center p-6">
							<div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: i % 2 === 0 ? "var(--brand-teal-glow)" : "var(--brand-violet-glow)", color: i % 2 === 0 ? "var(--brand-teal)" : "var(--color-primary)" }}>
								{featIcons[i + 1]}
							</div>
							<h3 className="text-base font-semibold">{t(`feature-${f.key}-title`)}</h3>
							<p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(`feature-${f.key}-desc`)}</p>
						</div>
					))}
				</div>
			</section>
			<section className="mx-auto max-w-6xl px-6 pb-24 text-center">
				<div className="rounded-2xl border border-border bg-card px-6 py-16 relative isolate overflow-hidden">
					<div className="pointer-events-none absolute -inset-32 -z-10 opacity-40" style={{ background: "radial-gradient(ellipse 60% 50% at 50% 50%, var(--brand-violet-glow), transparent)" }} aria-hidden="true" />
					<h2 className="text-3xl font-semibold tracking-tight" style={{ fontFamily: "var(--font-display)" }}>{t("cta-title")}</h2>
					<p className="mx-auto mt-4 max-w-md text-muted-foreground">{t("cta-subtitle")}</p>
					<Link href="/pricing" className="btn-primary mt-8">{t("cta-button")}</Link>
				</div>
			</section>
		</>
	);
}
