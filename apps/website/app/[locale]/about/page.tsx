import { Hero } from "@/components/marketing/Hero";
import { getTranslations, setRequestLocale } from "next-intl/server";

const values = [{ key: "1" }, { key: "2" }, { key: "3" }, { key: "4" }];

type Props = {
	params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "AboutPage" });
	return { title: t("title"), description: t("subtitle") };
}

export default async function AboutPage({ params }: Props) {
	const { locale } = await params;
	setRequestLocale(locale);
	const t = await getTranslations("AboutPage");

	return (
		<>
			<Hero title={t("title")} subtitle={t("subtitle")} />
			<section className="mx-auto max-w-3xl px-6 pb-20">
				<h2
					className="text-2xl font-semibold tracking-tight"
					style={{ fontFamily: "var(--font-display)" }}
				>
					{t("mission-title")}
				</h2>
				<p className="mt-4 text-base leading-relaxed text-muted-foreground">
					{t("mission-p1")}
				</p>
				<p className="mt-4 text-base leading-relaxed text-muted-foreground">
					{t("mission-p2")}
				</p>
				<p className="mt-4 text-base leading-relaxed text-muted-foreground">
					{t("mission-p3")}
				</p>
			</section>
			<section className="border-t border-border">
				<div className="mx-auto max-w-6xl px-6 py-20">
					<h2
						className="mb-12 text-center text-3xl font-semibold tracking-tight"
						style={{ fontFamily: "var(--font-display)" }}
					>
						{t("values-title")}
					</h2>
					<div className="grid gap-5 md:grid-cols-2">
						{values.map((v) => (
							<div key={v.key} className="bento-cell p-6">
								<h3 className="text-lg font-semibold">
									{t(`value-${v.key}-title`)}
								</h3>
								<p className="mt-2 text-sm leading-relaxed text-muted-foreground">
									{t(`value-${v.key}-desc`)}
								</p>
							</div>
						))}
					</div>
				</div>
			</section>
			<section className="mx-auto max-w-3xl px-6 py-20">
				<h2
					className="mb-8 text-center text-3xl font-semibold tracking-tight"
					style={{ fontFamily: "var(--font-display)" }}
				>
					{t("team-title")}
				</h2>
				<div className="relative rounded-2xl border border-border bg-card p-8 text-center">
					<div
						className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full text-lg font-bold"
						style={{
							backgroundColor: "var(--brand-violet-glow)",
							color: "var(--color-primary)",
						}}
					>
						{t("team-initials")}
					</div>
					<h3 className="text-lg font-semibold">{t("team-name")}</h3>
					<div className="mt-1 text-sm text-muted-foreground">
						{t("team-role")}
					</div>
					<p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground">
						{t("team-desc")}
					</p>
				</div>
			</section>
		</>
	);
}
