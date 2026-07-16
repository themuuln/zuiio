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
		key="horse"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.5"
		strokeLinecap="round"
		strokeLinejoin="round"
		className="h-6 w-6"
		aria-hidden="true"
	>
		<path d="M22 2 11 13" />
		<path d="m22 2-7 20-4-9-9-4z" />
	</svg>,
	<svg
		key="tree"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.5"
		strokeLinecap="round"
		strokeLinejoin="round"
		className="h-6 w-6"
		aria-hidden="true"
	>
		<path d="M12 22v-7" />
		<path d="M12 15c-3.5 0-6-2.5-6-6 0-2 1-3.5 2.5-4.5C9.5 4 11 3 12 3s2.5 1 3.5 1.5C17 5.5 18 7 18 9c0 3.5-2.5 6-6 6z" />
	</svg>,
	<svg
		key="health"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.5"
		strokeLinecap="round"
		strokeLinejoin="round"
		className="h-6 w-6"
		aria-hidden="true"
	>
		<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
	</svg>,
	<svg
		key="training"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.5"
		strokeLinecap="round"
		strokeLinejoin="round"
		className="h-6 w-6"
		aria-hidden="true"
	>
		<path d="M12 20h9" />
		<path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838.838-2.872a2 2 0 0 1 .506-.854z" />
	</svg>,
	<svg
		key="chart"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.5"
		strokeLinecap="round"
		strokeLinejoin="round"
		className="h-6 w-6"
		aria-hidden="true"
	>
		<path d="M3 3v18h18" />
		<path d="m19 9-5 5-4-4-3 3" />
	</svg>,
	<svg
		key="phone"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.5"
		strokeLinecap="round"
		strokeLinejoin="round"
		className="h-6 w-6"
		aria-hidden="true"
	>
		<rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
		<line x1="12" y1="18" x2="12.01" y2="18" />
	</svg>,
];

type Props = {
	params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "TamgaPage" });
	return { title: `${t("title")} — Horse Management`, description: t("subtitle") };
}

export default async function TamgaProductPage({ params }: Props) {
	const { locale } = await params;
	setRequestLocale(locale);
	const t = await getTranslations("TamgaPage");

	return (
		<>
			<Hero
				title={t("title")}
				subtitle={t("subtitle")}
				cta={{ label: t("cta"), href: "#" }}
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
								backgroundColor: "oklch(0.6 0.18 15 / 0.12)",
								color: "oklch(0.6 0.18 15)",
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
											: "oklch(0.6 0.18 15 / 0.12)",
									color:
										i % 2 === 0 ? "var(--brand-teal)" : "oklch(0.6 0.18 15)",
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
								"radial-gradient(ellipse 60% 50% at 50% 50%, oklch(0.6 0.18 15 / 0.15), transparent)",
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
					<Link href="#" className="btn-primary mt-8">
						{t("cta-button")}
					</Link>
				</div>
			</section>
		</>
	);
}
