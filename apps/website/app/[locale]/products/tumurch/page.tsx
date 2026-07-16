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
		key="dumbbell"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.5"
		strokeLinecap="round"
		strokeLinejoin="round"
		className="h-6 w-6"
		aria-hidden="true"
	>
		<path d="M14.4 14.4 9.6 9.6" />
		<path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z" />
		<path d="m21.5 21.5-1.4-1.4" />
		<path d="M3.9 3.9 2.5 2.5" />
		<path d="M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829z" />
	</svg>,
	<svg
		key="coach"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.5"
		strokeLinecap="round"
		strokeLinejoin="round"
		className="h-6 w-6"
		aria-hidden="true"
	>
		<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
		<circle cx="9" cy="7" r="4" />
		<path d="M22 21v-2a4 4 0 0 0-3-3.87" />
		<path d="M16 3.13a4 4 0 0 1 0 7.75" />
	</svg>,
	<svg
		key="credit"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.5"
		strokeLinecap="round"
		strokeLinejoin="round"
		className="h-6 w-6"
		aria-hidden="true"
	>
		<rect x="2" y="5" width="20" height="14" rx="2" />
		<line x1="2" y1="10" x2="22" y2="10" />
	</svg>,
	<svg
		key="reception"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.5"
		strokeLinecap="round"
		strokeLinejoin="round"
		className="h-6 w-6"
		aria-hidden="true"
	>
		<rect x="3" y="3" width="18" height="18" rx="2" />
		<path d="M9 3v18" />
		<path d="M14 9h3" />
		<path d="M14 13h3" />
	</svg>,
	<svg
		key="shop"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.5"
		strokeLinecap="round"
		strokeLinejoin="round"
		className="h-6 w-6"
		aria-hidden="true"
	>
		<path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
		<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
		<path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
		<path d="M2 7h20" />
		<path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7" />
	</svg>,
	<svg
		key="lock"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.5"
		strokeLinecap="round"
		strokeLinejoin="round"
		className="h-6 w-6"
		aria-hidden="true"
	>
		<rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
		<path d="M7 11V7a5 5 0 0 1 10 0v4" />
	</svg>,
];

type Props = {
	params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "TumurchPage" });
	return { title: `${t("title")} — Gym Platform`, description: t("subtitle") };
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
								backgroundColor: "oklch(0.7 0.16 75 / 0.12)",
								color: "oklch(0.7 0.16 75)",
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
											? "oklch(0.6 0.18 15 / 0.12)"
											: "oklch(0.7 0.16 75 / 0.12)",
									color:
										i % 2 === 0 ? "oklch(0.6 0.18 15)" : "oklch(0.7 0.16 75)",
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
								"radial-gradient(ellipse 60% 50% at 50% 50%, oklch(0.7 0.16 75 / 0.15), transparent)",
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
