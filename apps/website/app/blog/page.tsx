import type { Metadata } from "next";
import { Hero } from "@/components/marketing/Hero";
import Link from "next/link";

export const metadata: Metadata = {
	title: "Blog",
	description:
		"Product updates, company news, and thoughts on building software for Mongolian businesses.",
};

const posts = [
	{
		slug: "welcome-to-zuiio",
		title: "Welcome to Zuiio",
		excerpt:
			"Why we're building software for Mongolian businesses, and what we've learned so far.",
		date: "2026-06-15",
		author: "Zuiio Team",
	},
	{
		slug: "getting-started-with-zer",
		title: "Getting Started with Zer",
		excerpt:
			"A practical walkthrough of Zer's core features — inventory, sales, expenses, and reporting.",
		date: "2026-05-20",
		author: "Zuiio Team",
	},
];

export default function BlogPage() {
	return (
		<>
			<Hero
				title="Blog"
				subtitle="Product updates, company news, and thoughts on building software for Mongolia."
			/>
			<section className="mx-auto max-w-3xl px-6 pb-24">
				<div className="space-y-6">
					{posts.map((post) => (
						<Link
							key={post.slug}
							href={`/blog/${post.slug}`}
							className="group relative block rounded-2xl border border-border bg-card p-6 transition-all duration-250 ease-out hover:shadow-card-hover hover:-translate-y-0.5"
						>
							<div className="flex items-center gap-3 text-xs text-muted-foreground">
								<time dateTime={post.date}>{post.date}</time>
								<span aria-hidden="true">&middot;</span>
								<span>{post.author}</span>
							</div>
							<h2
								className="mt-3 text-xl font-semibold tracking-tight transition-colors duration-250"
								style={{ fontFamily: "var(--font-display)" }}
							>
								{post.title}
							</h2>
							<p className="mt-2 text-sm leading-relaxed text-muted-foreground">
								{post.excerpt}
							</p>
							<div className="mt-4 flex items-center gap-1.5 text-sm font-medium text-primary opacity-0 transition-all duration-250 group-hover:opacity-100 group-hover:gap-3">
								Read more
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
									<path d="M5 12h14" />
									<path d="m12 5 7 7-7 7" />
								</svg>
							</div>
						</Link>
					))}
				</div>
			</section>
		</>
	);
}
