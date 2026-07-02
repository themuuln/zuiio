import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Blog Post" };

const posts: Record<string, { title: string; content: string }> = {
	"welcome-to-zuiio": {
		title: "Welcome to Zuiio",
		content:
			"We started Zuiio because we saw Mongolian businesses struggling with software built for other markets.\n\nPayroll systems that don't understand Mongolian social insurance brackets. Accounting tools that don't support Mongolian tax codes. Repair shop software that's never seen a ger district delivery route.\n\nWe're building differently.\n\n**Built for Mongolia, from day one.** Every calculation, every form, every integration — it's all designed for the way Mongolian businesses actually work. Not adapted after the fact.\n\n**Offline first.** Internet in Mongolia isn't always reliable. Your software shouldn't stop working when the connection drops. All our products work offline and sync when you reconnect.\n\n**One brand, two tools.** Zer handles HR and accounting. Tolom manages auto repair shops. They share the same design, the same philosophy, and eventually — the same data.\n\nThis is just the beginning. We'll be sharing more about what we're building, how we build it, and what we learn along the way.\n\n— The Zuiio Team",
	},
	"mongolian-payroll-explained": {
		title: "Mongolian Payroll: What Every Business Should Know",
		content:
			"Running payroll in Mongolia means navigating a unique set of rules. Here's what you need to know.\n\n**Income Tax Brackets**\n\nMongolian personal income tax uses a progressive rate structure. As of 2026:\n\n- First ₮0–₮X per month: 0%\n- Next bracket: 10%\n- Above: Higher rates apply\n\n(Note: Exact brackets change annually. Zer updates automatically.)\n\n**Social Insurance Contributions**\n\nBoth employers and employees contribute. Current rates:\n\n- **Employee**: 11.5% of salary (pension, health, unemployment, social welfare)\n- **Employer**: 11.5% on top of salary\n\nThese are calculated on a cap — currently around ₮X per month.\n\n**Common Mistakes**\n\n1. **Forgetting the cap.** Social insurance contributions are capped. Many businesses overpay.\n2. **Mixing personal and business expenses.** Especially common in small businesses. Keep clear records.\n3. **Missing filing deadlines.** The General Authority for Social Insurance has strict deadlines. Late filings mean penalties.\n\n**How Zer Helps**\n\nZer calculates all of this automatically. Enter an employee's salary, and we handle the rest — tax, social insurance, filings, and reports.\n\nNo spreadsheets. No manual calculations. No missed deadlines.",
	},
};

export default async function BlogPostPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	const post = posts[slug];

	if (!post) {
		return (
			<div className="mx-auto max-w-3xl px-6 py-24 text-center">
				<h1
					className="text-3xl font-semibold tracking-tight"
					style={{ fontFamily: "var(--font-display)" }}
				>
					Post not found
				</h1>
				<Link href="/blog" className="btn-secondary mt-6 inline-flex">
					<svg
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
						aria-hidden="true"
					>
						<path d="m12 19-7-7 7-7" />
						<path d="M19 12H5" />
					</svg>
					Back to blog
				</Link>
			</div>
		);
	}

	return (
		<article className="mx-auto max-w-3xl px-6 py-16">
			<Link href="/blog" className="btn-secondary inline-flex text-sm">
				<svg
					width="14"
					height="14"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
					aria-hidden="true"
				>
					<path d="m12 19-7-7 7-7" />
					<path d="M19 12H5" />
				</svg>
				Back to blog
			</Link>
			<h1
				className="mt-8 text-3xl font-semibold tracking-tight md:text-4xl"
				style={{ fontFamily: "var(--font-display)" }}
			>
				{post.title}
			</h1>
			<div className="mt-10 space-y-4 text-base leading-relaxed text-foreground/90 whitespace-pre-line">
				{post.content}
			</div>
		</article>
	);
}
