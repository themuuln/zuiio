import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Blog Post" };

const posts: Record<string, { title: string; content: string }> = {
	"welcome-to-zuiio": {
		title: "Welcome to Zuiio",
		content:
			"We started Zuiio because we saw Mongolian businesses struggling with software built for other markets.\n\nInventory systems that weren't designed for Mongolian small businesses. Sales tools that didn't work offline. Auto repair software that had never seen a ger district delivery route.\n\nWe're building differently.\n\n**Built for Mongolia, from day one.** Every feature, every form, every workflow — it's all designed for the way Mongolian businesses actually work. Not adapted after the fact.\n\n**Offline first.** Internet in Mongolia isn't always reliable. Your software shouldn't stop working when the connection drops. All our products work offline and sync when you reconnect.\n\n**One brand, two products.** Zer is a mini ERP for SMEs — inventory, sales, expenses, customers, and reports. Tolom manages auto repair shops — bay view, work orders, parts, estimates, and mechanics. They share the same design, the same philosophy.\n\nThis is just the beginning. We'll be sharing more about what we're building, how we build it, and what we learn along the way.\n\n— The Zuiio Team",
	},
	"getting-started-with-zer": {
		title: "Getting Started with Zer",
		content:
			"Zer is a mini ERP built for Mongolian small and medium businesses. Here's what you can do from day one.\n\n**Inventory & Stock Management**\n\nTrack products, categories, units, and stock levels in real time. Zer gives you automatic stock counts, product codes, price history, and low-stock alerts so you always know what's on your shelves.\n\n**Sales with POS**\n\nCreate sales with multi-line entry, customer selection, and payment tracking. The Shop POS module gives you a product catalog, cart, checkout with numeric keypad, and receipt printing — perfect for retail.\n\n**Expense Tracking**\n\nLog expenses by category, amount, date, and payment method. Get monthly expense reports with comparisons and CSV export.\n\n**Customer & Supplier Management**\n\nStore detailed profiles with contact info, balance tracking, and full transaction history for both customers and suppliers.\n\n**Reports & Analytics**\n\nSales, expense, and profit reports with charts and graphs. Date range filtering, CSV export, and public share links that don't require login.\n\n**Multi-Branch Support**\n\nManage multiple physical locations with isolated transactions per branch. Get a consolidated accounting view across all branches.\n\nReady to get started? Create your free account and start tracking your business today.",
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
