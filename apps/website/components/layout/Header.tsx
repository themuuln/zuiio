"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

function MenuIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<line x1="3" y1="6" x2="21" y2="6" />
			<line x1="3" y1="12" x2="21" y2="12" />
			<line x1="3" y1="18" x2="21" y2="18" />
		</svg>
	);
}

function CloseIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
		>
			<path d="M18 6 6 18" />
			<path d="m6 6 12 12" />
		</svg>
	);
}

const navLinks = [
	{ href: "/", label: "Home" },
	{ href: "/products", label: "Products" },
	{ href: "/pricing", label: "Pricing" },
	{ href: "/blog", label: "Blog" },
	{ href: "/about", label: "About" },
];

export function Header() {
	const pathname = usePathname();
	const [open, setOpen] = useState(false);
	const [scrolled, setScrolled] = useState(false);

	useEffect(() => {
		const onScroll = () => setScrolled(window.scrollY > 8);
		window.addEventListener("scroll", onScroll, { passive: true });
		onScroll();
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	useEffect(() => {
		setOpen(false);
	}, [pathname]);

	useEffect(() => {
		document.body.style.overflow = open ? "hidden" : "";
		return () => {
			document.body.style.overflow = "";
		};
	}, [open]);

	const isActive = (href: string) => {
		if (href === "/") return pathname === "/";
		return pathname.startsWith(href);
	};

	return (
		<header
			className={cn(
				"sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-lg transition-shadow duration-250",
				scrolled && "shadow-sm",
			)}
		>
			<div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
				<Link href="/" className="flex items-center gap-2.5">
					<div
						className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-primary-foreground"
						style={{ backgroundColor: "var(--color-primary)" }}
					>
						Z
					</div>
					<span
						className="text-xl font-semibold tracking-tight"
						style={{ fontFamily: "var(--font-display)" }}
					>
						zuiio
					</span>
				</Link>

				<nav
					className="hidden items-center gap-1 md:flex"
					aria-label="Main navigation"
				>
					{navLinks.map((link) => (
						<Link
							key={link.href}
							href={link.href}
							className={cn(
								"relative rounded-lg px-3 py-2 text-sm font-medium transition-colors",
								isActive(link.href)
									? "text-foreground"
									: "text-muted-foreground hover:text-foreground",
							)}
						>
							{link.label}
							{isActive(link.href) && (
								<span
									className="absolute -bottom-[17px] left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full"
									style={{ backgroundColor: "var(--color-primary)" }}
									aria-hidden="true"
								/>
							)}
						</Link>
					))}
				</nav>

				<Link href="/pricing" className="btn-primary hidden md:inline-flex">
					Get started
				</Link>

				<button
					type="button"
					className="inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:text-foreground md:hidden"
					onClick={() => setOpen(!open)}
					aria-label={open ? "Close menu" : "Open menu"}
					aria-expanded={open}
				>
					{open ? <CloseIcon /> : <MenuIcon />}
				</button>
			</div>

			{open && (
				<div
					className="fixed inset-0 top-16 z-40 flex flex-col bg-background/95 backdrop-blur-lg md:hidden animate-fade-in"
					role="dialog"
					aria-modal="true"
					aria-label="Navigation menu"
				>
					<nav
						className="flex flex-col gap-2 px-6 pb-8 pt-6"
						aria-label="Mobile navigation"
					>
						{navLinks.map((link) => (
							<Link
								key={link.href}
								href={link.href}
								onClick={() => setOpen(false)}
								className={cn(
									"rounded-xl px-4 py-3.5 text-base font-medium transition-colors",
									isActive(link.href)
										? "bg-primary/10 text-foreground"
										: "text-muted-foreground hover:text-foreground hover:bg-muted",
								)}
							>
								{link.label}
							</Link>
						))}
						<div className="mt-4 border-t border-border pt-4">
							<Link
								href="/pricing"
								className="btn-primary w-full justify-center"
								onClick={() => setOpen(false)}
							>
								Get started
							</Link>
						</div>
					</nav>
				</div>
			)}
		</header>
	);
}
