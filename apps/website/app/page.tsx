import { Hero } from "@/components/marketing/Hero";
import { ProductCard } from "@/components/marketing/ProductCard";
import { FeatureSection } from "@/components/marketing/FeatureSection";
import { Testimonial } from "@/components/marketing/Testimonial";
import { PricingCard } from "@/components/marketing/PricingCard";
import Link from "next/link";

const features = [
	{
		title: "Built for Mongolia",
		description:
			"Mongolian tax codes, social insurance brackets, and labor laws — handled automatically. No spreadsheets, no manual calculations.",
	},
	{
		title: "Works offline",
		description:
			"Garage with spotty internet? No problem. Your data syncs when you're back online. Never lose a record.",
	},
	{
		title: "One integration, many tools",
		description:
			"HR, accounting, and repair management share the same data. Enter it once, use it everywhere.",
	},
	{
		title: "Simple pricing",
		description:
			"No hidden fees, no per-seat surprises. Pay for what you use, scale when you're ready.",
	},
	{
		title: "Mongolian language first",
		description:
			"Full Mongolian (Cyrillic) UI. Your team shouldn't have to work in a second language to manage their own business.",
	},
	{
		title: "Real-time collaboration",
		description:
			"See changes as they happen. Multiple users, same data, no conflicts.",
	},
];

const testimonials = [
	{
		quote:
			"Zer saved us hours every month on payroll. The social insurance calculation alone was worth the switch.",
		author: "Бат-Эрдэнэ",
		role: "CFO, Эрдэнэт ХХК",
	},
	{
		quote:
			"Tolom transformed our shop. Scheduling, invoicing, parts tracking — all in one place. Our mechanics love it.",
		author: "Солонго",
		role: "Owner, Унаагар Auto Service",
	},
];

const plans = [
	{
		name: "Starter",
		price: "Free",
		description: "For small teams getting started.",
		features: [
			"Up to 5 employees",
			"Basic payroll",
			"Standard reports",
			"Email support",
		],
	},
	{
		name: "Pro",
		price: "₮49,000",
		description: "For growing businesses.",
		features: [
			"Up to 50 employees",
			"Full payroll + social insurance",
			"Advanced reports",
			"Priority support",
			"Offline mode",
		],
		highlighted: true,
	},
	{
		name: "Enterprise",
		price: "₮149,000",
		description: "For organizations with custom needs.",
		features: [
			"Unlimited employees",
			"Everything in Pro",
			"Custom integrations",
			"Dedicated support",
			"SLA guarantee",
		],
	},
];

export default function HomePage() {
	return (
		<>
			<Hero
				title="Mongolian business software, built for the way you work."
				subtitle="Zer handles HR and accounting. Tolom runs your auto repair shop. One brand, two tools — both made for Mongolia."
				cta={{ label: "Explore products", href: "/products" }}
				secondaryCta={{ label: "See pricing", href: "/pricing" }}
			/>

			<section className="mx-auto max-w-6xl px-6 pb-20">
				<div className="flex flex-col gap-3 text-center mb-12">
					<h2
						className="text-3xl font-semibold tracking-tight md:text-4xl"
						style={{ fontFamily: "var(--font-display)" }}
					>
						Our products
					</h2>
					<p className="text-muted-foreground max-w-lg mx-auto">
						Two tools that work together — or stand alone.
					</p>
				</div>
				<div className="grid gap-6 md:grid-cols-2">
					<ProductCard
						name="Zer"
						tagline="HR & Accounting"
						description="Payroll, social insurance, tax filings, and employee management — everything Mongolian businesses need to run their people operations."
						href="/products/zer"
						variant="zer"
					/>
					<ProductCard
						name="Tolom"
						tagline="Auto Repair Management"
						description="Scheduling, job tracking, parts inventory, invoices, and customer management for Mongolian auto repair shops."
						href="/products/tolom"
						variant="tolom"
					/>
				</div>
			</section>

			<FeatureSection
				title="Why Zuiio?"
				description="We build software that respects your time, your data, and your way of working."
				features={features}
			/>

			<section className="mx-auto max-w-6xl px-6 pb-20">
				<h2
					className="mb-12 text-center text-3xl font-semibold tracking-tight md:text-4xl"
					style={{ fontFamily: "var(--font-display)" }}
				>
					Trusted by Mongolian businesses
				</h2>
				<div className="grid gap-6 md:grid-cols-2">
					{testimonials.map((t) => (
						<Testimonial key={t.author} {...t} />
					))}
				</div>
			</section>

			<section className="mx-auto max-w-6xl px-6 pb-20" id="pricing">
				<h2
					className="mb-4 text-center text-3xl font-semibold tracking-tight md:text-4xl"
					style={{ fontFamily: "var(--font-display)" }}
				>
					Simple, transparent pricing
				</h2>
				<p className="mx-auto mb-12 max-w-lg text-center text-muted-foreground">
					No hidden fees. No per-seat surprises. Start free, upgrade when you
					grow.
				</p>
				<div className="grid gap-6 md:grid-cols-3">
					{plans.map((plan) => (
						<PricingCard key={plan.name} {...plan} />
					))}
				</div>
			</section>

			<section className="mx-auto max-w-6xl px-6 pb-24">
				<div
					className="relative isolate overflow-hidden rounded-2xl px-6 py-16 text-center md:py-20"
					style={{
						backgroundColor: "var(--color-card)",
						border: "1px solid var(--color-border)",
					}}
				>
					<div
						className="pointer-events-none absolute -inset-32 -z-10 opacity-40"
						style={{
							background:
								"radial-gradient(ellipse 60% 50% at 50% 50%, var(--brand-violet-glow), transparent)",
						}}
						aria-hidden="true"
					/>
					<h2
						className="text-3xl font-semibold tracking-tight md:text-4xl"
						style={{ fontFamily: "var(--font-display)" }}
					>
						Ready to simplify your business?
					</h2>
					<p className="mx-auto mt-4 max-w-lg text-muted-foreground">
						Join Mongolian businesses already using Zuiio. Start free, no credit
						card required.
					</p>
					<div className="mt-8 flex flex-wrap items-center justify-center gap-4">
						<Link href="/pricing" className="btn-primary">
							Get started free
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2.5"
								strokeLinecap="round"
								strokeLinejoin="round"
								aria-hidden="true"
							>
								<path d="M5 12h14" />
								<path d="m12 5 7 7-7 7" />
							</svg>
						</Link>
						<Link href="/about" className="btn-secondary">
							Learn more
						</Link>
					</div>
				</div>
			</section>
		</>
	);
}
