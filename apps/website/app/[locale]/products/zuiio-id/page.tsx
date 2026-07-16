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
		key="key"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.5"
		strokeLinecap="round"
		strokeLinejoin="round"
		className="h-6 w-6"
		aria-hidden="true"
	>
		<path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4" />
		<path d="m21 2-9.6 9.6" />
		<circle cx="7.5" cy="15.5" r="5.5" />
	</svg>,
	<svg
		key="org"
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
		key="shield"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.5"
		strokeLinecap="round"
		strokeLinejoin="round"
		className="h-6 w-6"
		aria-hidden="true"
	>
		<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
	</svg>,
	<svg
		key="mfa"
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
	<svg
		key="terminal"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.5"
		strokeLinecap="round"
		strokeLinejoin="round"
		className="h-6 w-6"
		aria-hidden="true"
	>
		<polyline points="4 17 10 11 4 5" />
		<line x1="12" y1="19" x2="20" y2="19" />
	</svg>,
	<svg
		key="audit"
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
];

type Props = {
	params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "ZuiioIDPage" });
	return { title: `${t("title")} — Single Sign-On`, description: t("subtitle") };
}

export default async function ZuiioIdProductPage({ params }: Props) {
	const { locale } = await params;
	setRequestLocale(locale);
	const t = await getTranslations("ZuiioIDPage");

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
								backgroundColor: "oklch(0.55 0.02 260 / 0.1)",
								color: "oklch(0.55 0.02 260)",
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
											? "var(--brand-violet-glow)"
											: "oklch(0.55 0.02 260 / 0.1)",
									color:
										i % 2 === 0
											? "var(--color-primary)"
											: "oklch(0.55 0.02 260)",
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
								"radial-gradient(ellipse 60% 50% at 50% 50%, oklch(0.55 0.02 260 / 0.1), transparent)",
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
