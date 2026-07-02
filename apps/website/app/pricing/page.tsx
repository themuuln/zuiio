import type { Metadata } from "next";
import { Hero } from "@/components/marketing/Hero";
import { PricingCard } from "@/components/marketing/PricingCard";

export const metadata: Metadata = {
	title: "Pricing",
	description:
		"Simple, transparent pricing for Zuiio products. Start free, upgrade when you grow.",
};

const plans = [
	{
		name: "Starter",
		price: "Free",
		description: "For small teams getting started.",
		features: [
			"Up to 5 users",
			"Core features",
			"Standard reports",
			"Email support",
		],
	},
	{
		name: "Pro",
		price: "₮49,000",
		description: "For growing businesses.",
		features: [
			"Up to 50 users",
			"All features",
			"Multi-branch support",
			"Advanced reports",
			"Priority support",
			"Offline mode",
		],
		highlighted: true,
	},
	{
		name: "Enterprise",
		price: "Contact us",
		description: "For organizations with custom needs.",
		features: [
			"Unlimited users",
			"Everything in Pro",
			"Custom integrations",
			"Dedicated support",
			"SLA guarantee",
		],
	},
];

export default function PricingPage() {
	return (
		<>
			<Hero
				title="Simple pricing"
				subtitle="No hidden fees, no per-seat surprises. Start free, upgrade when you grow."
			/>
			<section className="mx-auto max-w-5xl px-6 pb-24">
				<div className="grid gap-6 md:grid-cols-3">
					{plans.map((plan) => (
						<PricingCard key={plan.name} {...plan} />
					))}
				</div>
				<div className="mt-16 rounded-2xl border border-border bg-card p-8 text-center relative isolate overflow-hidden">
					<div
						className="pointer-events-none absolute -inset-32 -z-10 opacity-30"
						style={{
							background:
								"radial-gradient(ellipse 60% 50% at 50% 50%, var(--brand-violet-glow), transparent)",
						}}
						aria-hidden="true"
					/>
					<h3
						className="text-xl font-semibold"
						style={{ fontFamily: "var(--font-display)" }}
					>
						Need a custom plan?
					</h3>
					<p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
						Contact us for custom pricing, volume discounts, or enterprise
						features.
					</p>
					<a
						href="mailto:sales@zuiio.com"
						className="btn-primary mt-6 inline-flex"
					>
						Contact sales
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
					</a>
				</div>
			</section>
		</>
	);
}
