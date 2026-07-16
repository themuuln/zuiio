import { Hero } from "@/components/marketing/Hero";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";

const features = [
	"inventory",
	"sales",
	"expenses",
	"customers",
	"reporting",
	"scheduling",
	"work-orders",
	"parts",
	"estimates",
	"mechanics",
	"offline",
	"multi-branch",
	"api",
] as const;

const zerHas: Record<string, boolean> = {
	inventory: true,
	sales: true,
	expenses: true,
	customers: true,
	reporting: true,
	offline: true,
	"multi-branch": true,
	api: true,
};

const tolomHas: Record<string, boolean> = {
	inventory: true,
	sales: true,
	scheduling: true,
	"work-orders": true,
	parts: true,
	estimates: true,
	mechanics: true,
	offline: true,
};

function CheckIcon({ color }: { color: string }) {
	return (
		<span
			className="inline-flex h-6 w-6 items-center justify-center rounded-full"
			style={{ backgroundColor: `color-mix(in oklch, ${color} 12%, transparent)`, color }}
		>
			<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
				<path d="M20 6 9 17l-5-5" />
			</svg>
		</span>
	);
}

type Props = {
	params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "ComparePage" });
	return { title: t("title"), description: t("subtitle") };
}

export default async function ComparePage({ params }: Props) {
	const { locale } = await params;
	setRequestLocale(locale);
	const t = await getTranslations("ComparePage");

	return (
		<>
			<Hero title={t("title")} subtitle={t("subtitle")} />
			<section className="mx-auto max-w-4xl px-6 pb-24">
				<div className="overflow-x-auto">
					<table className="w-full text-left text-sm">
						<thead>
							<tr className="border-b border-border">
								<th className="py-4 pr-4 font-semibold text-muted-foreground">{t("feature")}</th>
								<th className="py-4 px-4 font-semibold" style={{ color: "var(--color-primary)" }}>{t("zer")}</th>
								<th className="py-4 pl-4 font-semibold" style={{ color: "var(--brand-teal)" }}>{t("tolom")}</th>
							</tr>
						</thead>
						<tbody>
							{features.map((f) => (
								<tr key={f} className="border-b border-border/50">
									<td className="py-3.5 pr-4 text-muted-foreground">{t(f)}</td>
									<td className="py-3.5 px-4">
										{zerHas[f] ? <CheckIcon color="var(--color-primary)" /> : <span className="text-muted-foreground/40">—</span>}
									</td>
									<td className="py-3.5 pl-4">
										{tolomHas[f] ? <CheckIcon color="var(--brand-teal)" /> : <span className="text-muted-foreground/40">—</span>}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
				<p className="mt-8 text-center text-sm text-muted-foreground">{t("note")}</p>
				<div className="mt-8 flex flex-wrap items-center justify-center gap-4">
					<Link href="/products/zer" className="btn-primary">{t("cta-zer")}</Link>
					<Link href="/products/tolom" className="btn-secondary">{t("cta-tolom")}</Link>
				</div>
			</section>
		</>
	);
}
