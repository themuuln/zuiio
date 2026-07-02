import type { Metadata } from "next";
import { Hero } from "@/components/marketing/Hero";
import Link from "next/link";

export const metadata: Metadata = {
	title: "Zer — Mini ERP",
	description:
		"Inventory management, sales, expenses, customer management, and reporting for Mongolian small and medium businesses.",
};

const features = [
	{
		title: "Inventory & Stock Management",
		description:
			"Track products, categories, units, and stock levels in real time. Automatic stock counts, product codes, price history, and low-stock alerts.",
	},
	{
		title: "Sales & POS",
		description:
			"Create sales with multi-line entry, customer selection, and payment tracking. Shop POS module with product catalog, cart, checkout, and receipt printing for retail.",
	},
	{
		title: "Expense Tracking",
		description:
			"Log expenses by category, amount, date, and payment method. Monthly expense reports with comparisons and CSV export.",
	},
	{
		title: "Customer & Supplier Management",
		description:
			"Detailed profiles with contact info, balance tracking, and full transaction history for both customers and suppliers.",
	},
	{
		title: "Reports & Analytics",
		description:
			"Sales, expense, and profit reports with charts and graphs. Date range filtering, CSV export, and public share links.",
	},
	{
		title: "Multi-Branch Support",
		description:
			"Manage multiple physical locations with isolated transactions per branch. Consolidated accounting view across all branches.",
	},
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

export default function ZerProductPage() {
	return (
		<>
			<Hero
				title="Zer"
				subtitle="Mini ERP for Mongolian SMEs. Inventory, sales, expenses, customers, and reports — all in one system."
				cta={{ label: "Get started", href: "/pricing" }}
				secondaryCta={{ label: "Learn more", href: "#features" }}
			/>
			<section id="features" className="mx-auto max-w-6xl px-6 pb-24">
				<div className="mx-auto max-w-2xl text-center mb-16">
					<h2
						className="text-3xl font-semibold tracking-tight md:text-4xl"
						style={{ fontFamily: "var(--font-display)" }}
					>
						Everything you need to run your business
					</h2>
					<p className="mt-4 text-lg text-muted-foreground">
						From inventory to sales to reporting, Zer handles the complexity of
						running a Mongolian small business so you don&apos;t have to.
					</p>
				</div>
				<div className="grid gap-5 md:grid-cols-3 md:grid-rows-2">
					<div className="bento-cell col-span-1 md:col-span-2 flex flex-col justify-center p-8">
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
							{features[0]?.title}
						</h3>
						<p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground md:text-base">
							{features[0]?.description}
						</p>
					</div>
					<div className="bento-cell flex flex-col justify-center p-6">
						<div
							className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg"
							style={{
								backgroundColor: "var(--brand-teal-glow)",
								color: "var(--brand-teal)",
							}}
						>
							{featIcons[1]}
						</div>
						<h3 className="text-base font-semibold">{features[1]?.title}</h3>
						<p className="mt-2 text-sm leading-relaxed text-muted-foreground">
							{features[1]?.description}
						</p>
					</div>
					<div className="bento-cell flex flex-col justify-center p-6">
						<div
							className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg"
							style={{
								backgroundColor: "var(--brand-violet-glow)",
								color: "var(--color-primary)",
							}}
						>
							{featIcons[2]}
						</div>
						<h3 className="text-base font-semibold">{features[2]?.title}</h3>
						<p className="mt-2 text-sm leading-relaxed text-muted-foreground">
							{features[2]?.description}
						</p>
					</div>
					<div className="bento-cell flex flex-col justify-center p-6">
						<div
							className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg"
							style={{
								backgroundColor: "var(--brand-teal-glow)",
								color: "var(--brand-teal)",
							}}
						>
							{featIcons[3]}
						</div>
						<h3 className="text-base font-semibold">{features[3]?.title}</h3>
						<p className="mt-2 text-sm leading-relaxed text-muted-foreground">
							{features[3]?.description}
						</p>
					</div>
					<div className="bento-cell flex flex-col justify-center p-6">
						<div
							className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg"
							style={{
								backgroundColor: "var(--brand-violet-glow)",
								color: "var(--color-primary)",
							}}
						>
							{featIcons[4]}
						</div>
						<h3 className="text-base font-semibold">{features[4]?.title}</h3>
						<p className="mt-2 text-sm leading-relaxed text-muted-foreground">
							{features[4]?.description}
						</p>
					</div>
					<div className="bento-cell flex flex-col justify-center p-6">
						<div
							className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg"
							style={{
								backgroundColor: "var(--brand-teal-glow)",
								color: "var(--brand-teal)",
							}}
						>
							{featIcons[5]}
						</div>
						<h3 className="text-base font-semibold">{features[5]?.title}</h3>
						<p className="mt-2 text-sm leading-relaxed text-muted-foreground">
							{features[5]?.description}
						</p>
					</div>
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
						Ready to simplify your business?
					</h2>
					<p className="mx-auto mt-4 max-w-md text-muted-foreground">
						Start free. No credit card required.
					</p>
					<Link href="/pricing" className="btn-primary mt-8">
						See pricing
					</Link>
				</div>
			</section>
		</>
	);
}
