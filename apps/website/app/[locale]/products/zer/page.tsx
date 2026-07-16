import { Hero } from "@/components/marketing/Hero";
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

const featIcons = [
	<svg
		key="p"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.5"
		strokeLinecap="round"
		strokeLinejoin="round"
		className="h-6 w-6"
		aria-hidden="true"
	>
		<path d="M8 2v4" />
		<path d="M16 2v4" />
		<rect x="2" y="6" width="20" height="16" rx="2" />
		<path d="M2 10h20" />
	</svg>,
	<svg
		key="s"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.5"
		strokeLinecap="round"
		strokeLinejoin="round"
		className="h-5 w-5"
		aria-hidden="true"
	>
		<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
	</svg>,
	<svg
		key="e"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.5"
		strokeLinecap="round"
		strokeLinejoin="round"
		className="h-5 w-5"
		aria-hidden="true"
	>
		<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
		<circle cx="9" cy="7" r="4" />
		<path d="M22 21v-2a4 4 0 0 0-3-3.87" />
		<path d="M16 3.13a4 4 0 0 1 0 7.75" />
	</svg>,
	<svg
		key="t"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.5"
		strokeLinecap="round"
		strokeLinejoin="round"
		className="h-5 w-5"
		aria-hidden="true"
	>
		<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
		<polyline points="14 2 14 8 20 8" />
		<line x1="16" y1="13" x2="8" y2="13" />
		<line x1="16" y1="17" x2="8" y2="17" />
	</svg>,
	<svg
		key="f"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.5"
		strokeLinecap="round"
		strokeLinejoin="round"
		className="h-5 w-5"
		aria-hidden="true"
	>
		<line x1="12" y1="20" x2="12" y2="10" />
		<line x1="18" y1="20" x2="18" y2="4" />
		<line x1="6" y1="20" x2="6" y2="16" />
	</svg>,
	<svg
		key="o"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.5"
		strokeLinecap="round"
		strokeLinejoin="round"
		className="h-5 w-5"
		aria-hidden="true"
	>
		<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
	</svg>,
];

type Props = {
	params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "ZerPage" });
	return { title: `${t("title")} — Mini ERP`, description: t("subtitle") };
}

export default async function ZerProductPage({ params }: Props) {
	const { locale } = await params;
	setRequestLocale(locale);
	const t = await getTranslations("ZerPage");

	return (
		<>
			<Hero
				title={t("title")}
				subtitle={t("subtitle")}
				cta={{ label: t("cta"), href: "/pricing" }}
				secondaryCta={{ label: "Learn more…", href: "#features" }}
			/>
			<section id="features" className="mx-auto max-w-6xl px-6 pb-24">
				<div className="mx-auto max-w-2xl text-center mb-16">
					<h2
						className="text-3xl font-semibold tracking-tight md:text-4xl"
						style={{ fontFamily: "var(--font-display)" }}
					>
						{t("features-title")}
					</h2>
					<p className="mt-4 text-lg text-muted-foreground">
						{t("features-subtitle")}
					</p>
				</div>
				<div className="grid gap-5 md:grid-cols-3 md:grid-rows-2">
					<div className="bento-cell col-span-1 md:col-span-2 md:row-span-2 flex flex-col justify-center p-8">
						<div
							className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
							style={{
								backgroundColor: "var(--brand-violet-glow)",
								color: "var(--color-primary)",
							}}
						>
							{featIcons[0]}
						</div>
						<h3 className="text-xl font-semibold md:text-2xl">
							{t("feature-1-title")}
						</h3>
						<p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground md:text-base">
							{t("feature-1-desc")}
						</p>
					</div>
					{features.slice(1).map((f, i) => (
						<div
							key={f.key}
							className="bento-cell flex flex-col justify-center p-6"
						>
							<div
								className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg"
								style={{
									backgroundColor:
										i % 2 === 0
											? "var(--brand-teal-glow)"
											: "var(--brand-violet-glow)",
									color:
										i % 2 === 0 ? "var(--brand-teal)" : "var(--color-primary)",
								}}
							>
								{featIcons[i + 1]}
							</div>
							<h3 className="text-base font-semibold">
								{t(`feature-${f.key}-title`)}
							</h3>
							<p className="mt-2 text-sm leading-relaxed text-muted-foreground">
								{t(`feature-${f.key}-desc`)}
							</p>
						</div>
					))}
				</div>
			</section>
			<section className="mx-auto max-w-6xl px-6 pb-24 text-center">
				<div className="rounded-2xl border border-border bg-card px-6 py-16 relative isolate overflow-hidden">
					<div
						className="pointer-events-none absolute -inset-32 -z-10 opacity-40"
						style={{
							background:
								"radial-gradient(ellipse 60% 50% at 50% 50%, var(--brand-violet-glow), transparent)",
						}}
						aria-hidden="true"
					/>
					<h2
						className="text-3xl font-semibold tracking-tight"
						style={{ fontFamily: "var(--font-display)" }}
					>
						{t("cta-title")}
					</h2>
					<p className="mx-auto mt-4 max-w-md text-muted-foreground">
						{t("cta-subtitle")}
					</p>
					<Link href="/pricing" className="btn-primary mt-8">
						{t("cta-button")}
					</Link>
				</div>
			</section>
		</>
	);
}
