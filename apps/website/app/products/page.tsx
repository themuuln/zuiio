import type { Metadata } from "next";
import { Hero } from "@/components/marketing/Hero";
import { ProductCard } from "@/components/marketing/ProductCard";

export const metadata: Metadata = {
	title: "Products",
	description:
		"Explore Zuiio's products: Zer for HR & accounting, and Tolom for auto repair shop management.",
};

export default function ProductsPage() {
	return (
		<>
			<Hero
				title="Our products"
				subtitle="Two tools, one philosophy — software that feels like it was made for you."
			/>
			<section className="mx-auto max-w-4xl px-6 pb-24">
				<div className="grid gap-8 md:grid-cols-2">
					<ProductCard
						name="Zer"
						tagline="HR & Accounting"
						description="Payroll, social insurance, tax filings, employee management, and financial reporting. Zer handles the numbers so you can focus on your people."
						href="/products/zer"
						variant="zer"
					/>
					<ProductCard
						name="Tolom"
						tagline="Auto Repair Management"
						description="Job scheduling, repair tracking, parts inventory, invoicing, and customer management. Tolom keeps your shop running smoothly."
						href="/products/tolom"
						variant="tolom"
					/>
				</div>
			</section>
		</>
	);
}
