import { Hero } from "@/components/marketing/Hero";
import { ProductCard } from "@/components/marketing/ProductCard";
import { getTranslations, setRequestLocale } from "next-intl/server";

type Props = {
	params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "ProductsPage" });
	return { title: t("title"), description: t("subtitle") };
}

export default async function ProductsPage({ params }: Props) {
	const { locale } = await params;
	setRequestLocale(locale);
	const t = await getTranslations("ProductsPage");

	return (
		<>
			<Hero title={t("title")} subtitle={t("subtitle")} />
			<section className="mx-auto max-w-4xl px-6 pb-24">
				<div className="grid gap-8 md:grid-cols-2">
					<ProductCard
						name="Zer"
						tagline={t("zer-tagline")}
						description={t("zer-description")}
						href="/products/zer"
						variant="zer"
					/>
					<ProductCard
						name="Tolom"
						tagline={t("tolom-tagline")}
						description={t("tolom-description")}
						href="/products/tolom"
						variant="tolom"
					/>
				</div>
			</section>
		</>
	);
}
