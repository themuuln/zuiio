import type { Metadata } from "next";
import { Hero } from "@/components/marketing/Hero";

export const metadata: Metadata = {
	title: "About",
	description:
		"Learn about Zuiio — the team, the mission, and why we're building software for Mongolian businesses.",
};

const values = [
	{
		title: "Built for Mongolia",
		description:
			"We don't adapt software from other markets — we build from the ground up for Mongolian businesses. Tax codes, social insurance, language, and culture.",
	},
	{
		title: "Offline by default",
		description:
			"Mongolia's internet infrastructure is growing, but it's not everywhere yet. Our products work offline and sync when you reconnect.",
	},
	{
		title: "Simple where it counts",
		description:
			"We remove complexity, not features. Every button, every screen, every workflow is designed to make someone's job easier.",
	},
	{
		title: "Transparent pricing",
		description:
			"No hidden fees, no surprise charges. You pay for what you use, and you know exactly what you're paying for.",
	},
];

export default function AboutPage() {
	return (
		<>
			<Hero
				title="About Zuiio"
				subtitle="We build software for Mongolian businesses. One brand, two products, one mission — make work easier."
			/>
			<section className="mx-auto max-w-3xl px-6 pb-20">
				<h2
					className="text-2xl font-semibold tracking-tight"
					style={{ fontFamily: "var(--font-display)" }}
				>
					Our mission
				</h2>
				<p className="mt-4 text-base leading-relaxed text-muted-foreground">
					Most business software is built for markets like the US or Europe,
					then adapted for Mongolia — badly. Tax codes don&apos;t match, social
					insurance rules are wrong, and the language feels translated.
				</p>
				<p className="mt-4 text-base leading-relaxed text-muted-foreground">
					We&apos;re changing that. Zuiio products are built from the ground up
					for Mongolian businesses. Every form, every workflow, every feature
					— designed for how businesses actually work in Mongolia.
				</p>
				<p className="mt-4 text-base leading-relaxed text-muted-foreground">
					Zer is a mini ERP for SMEs — inventory, sales, expenses, customers,
					and reports. Tolom manages auto repair shops — bay view, work
					orders, parts, estimates, and mechanics. Two tools, one philosophy
					— software that feels like it was made for you.
				</p>
			</section>
			<section className="border-t border-border">
				<div className="mx-auto max-w-6xl px-6 py-20">
					<h2
						className="mb-12 text-center text-3xl font-semibold tracking-tight"
						style={{ fontFamily: "var(--font-display)" }}
					>
						Our values
					</h2>
					<div className="grid gap-5 md:grid-cols-2">
						{values.map((v) => (
							<div key={v.title} className="bento-cell p-6">
								<h3 className="text-lg font-semibold">{v.title}</h3>
								<p className="mt-2 text-sm leading-relaxed text-muted-foreground">
									{v.description}
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
					The team
				</h2>
				<div className="relative rounded-2xl border border-border bg-card p-8 text-center">
					<div
						className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full text-lg font-bold"
						style={{
							backgroundColor: "var(--brand-violet-glow)",
							color: "var(--color-primary)",
						}}
					>
						ZT
					</div>
					<h3 className="text-lg font-semibold">Zuiio Team</h3>
					<div className="mt-1 text-sm text-muted-foreground">
						Building software for Mongolia
					</div>
					<p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground">
						A small team passionate about making Mongolian businesses more
						efficient through great software. We&apos;re designers, engineers,
						and operators who understand the challenges of running a business in
						Mongolia.
					</p>
				</div>
			</section>
		</>
	);
}
