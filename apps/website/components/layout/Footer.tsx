import Link from "next/link";

const footerLinks = {
	Products: [
		{ href: "/products/zer", label: "Zer — Mini ERP" },
		{ href: "/products/tolom", label: "Tolom — Auto Repair" },
		{ href: "/pricing", label: "Pricing" },
	],
	Company: [
		{ href: "/about", label: "About" },
		{ href: "/blog", label: "Blog" },
	],
	Legal: [
		{ href: "/privacy", label: "Privacy Policy" },
		{ href: "/terms", label: "Terms of Service" },
		{ href: "/contact", label: "Contact" },
	],
};

export function Footer() {
	return (
		<footer className="border-t border-border">
			<div
				className="border-b border-border"
				style={{ backgroundColor: "oklch(0.5 0.26 275 / 0.03)" }}
			>
				<div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 py-12 md:flex-row md:justify-between">
					<div>
						<span
							className="text-lg font-semibold tracking-tight"
							style={{ fontFamily: "var(--font-display)" }}
						>
							Start simplifying your business today
						</span>
						<p className="mt-1 text-sm text-muted-foreground">
							Free to start. No credit card required.
						</p>
					</div>
					<Link href="/pricing" className="btn-primary shrink-0">
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
				</div>
			</div>

			<div className="mx-auto max-w-6xl px-6 py-12">
				<div className="grid grid-cols-2 gap-8 md:grid-cols-4">
					<div className="col-span-2 md:col-span-1">
						<div className="flex items-center gap-2.5">
							<div
								className="flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold text-primary-foreground"
								style={{ backgroundColor: "var(--color-primary)" }}
							>
								Z
							</div>
							<span
								className="text-lg font-semibold tracking-tight"
								style={{ fontFamily: "var(--font-display)" }}
							>
								zuiio
							</span>
						</div>
						<p className="mt-3 text-sm text-muted-foreground leading-relaxed">
							Mongolian business software, built for the way you work.
						</p>
					</div>
					{Object.entries(footerLinks).map(([heading, links]) => (
						<div key={heading}>
							<h3 className="mb-3 text-sm font-semibold text-foreground">
								{heading}
							</h3>
							<ul className="space-y-2.5">
								{links.map((link) => (
									<li key={link.href}>
										<Link
											href={link.href}
											className="text-sm text-muted-foreground transition-colors hover:text-foreground"
										>
											{link.label}
										</Link>
									</li>
								))}
							</ul>
						</div>
					))}
				</div>
				<div className="mt-12 flex flex-col items-center gap-4 border-t border-border pt-6 text-sm text-muted-foreground md:flex-row md:justify-between">
					<p>&copy; {new Date().getFullYear()} Zuiio. All rights reserved.</p>
					<div className="flex items-center gap-4">
						<span className="text-xs">Built for Mongolia</span>
					</div>
				</div>
			</div>
		</footer>
	);
}
