import type { Metadata } from "next";
import { Hero } from "@/components/marketing/Hero";
import { ProductCard } from "@/components/marketing/ProductCard";

export const metadata: Metadata = {
title: "Products",
description:
"Explore Zuiio's products: Zer mini ERP for business operations, and Tolom for auto repair shop management.",
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
						tagline="Mini ERP"
						description="Inventory and stock management, sales with POS, expense tracking, customer and supplier management, multi-branch support, reports and analytics. Zer runs your business operations."
						href="/products/zer"
						variant="zer"
					/>
					<ProductCard
						name="Tolom"
						tagline="Auto Repair Management"
						description="Bay view workshop scheduling, work orders, parts inventory, estimates, mechanic management, and customer vehicle history. Tolom keeps your shop running smoothly."
						href="/products/tolom"
						variant="tolom"
					/>
				</div>
			</section>
		</>
	);
}
