"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ReactFlowProvider } from "@xyflow/react";
import { Sidebar } from "@/components/Sidebar";
import { FacebookConnector } from "@/components/FacebookConnector";
import { useFlowStore } from "@/store/flowStore";
import { useUiStore } from "@/store/uiStore";

// Lazy-load heavy workspace components — only fetched when their tab is active
const FlowCanvas = dynamic(
	() => import("@/components/FlowCanvas").then((m) => m.FlowCanvas),
	{ ssr: false },
);
const NodeEditor = dynamic(
	() => import("@/components/NodeEditor").then((m) => m.NodeEditor),
	{ ssr: false },
);
const ContactsWorkspace = dynamic(
	() =>
		import("@/components/ContactsWorkspace").then((m) => m.ContactsWorkspace),
	{ ssr: false },
);
const AutomationWorkspace = dynamic(
	() =>
		import("@/components/AutomationWorkspace").then(
			(m) => m.AutomationWorkspace,
		),
	{ ssr: false },
);

export default function Home() {
	const [mounted, setMounted] = useState(false);
	const activeTab = useUiStore((s) => s.activeTab);
	const automationView = useUiStore((s) => s.automationView);
	const activeAutomationName = useUiStore((s) => s.activeAutomationName);
	const openAutomationBuilder = useUiStore((s) => s.openAutomationBuilder);
	const backToAutomationList = useUiStore((s) => s.backToAutomationList);
	const previewMode = useUiStore((s) => s.previewMode);
	const togglePreviewMode = useUiStore((s) => s.togglePreviewMode);
	const nodes = useFlowStore((s) => s.nodes);
	const edges = useFlowStore((s) => s.edges);
	const activeWorkspaceLabel =
		activeTab.charAt(0).toUpperCase() + activeTab.slice(1);

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return (
			<div className="flex h-screen w-screen items-center justify-center bg-bg">
				<div className="flex flex-col items-center gap-3">
					<div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent" />
					<span className="text-xs text-text-muted">Loading…</span>
				</div>
			</div>
		);
	}

	return (
		<ReactFlowProvider>
			<div className="flex h-screen w-screen overflow-hidden flex-col">
				<header className="h-11 shrink-0 border-b border-border bg-rail flex items-center justify-between px-3 md:px-4">
					<div className="hidden md:flex items-center gap-2 text-[13px] text-text-muted min-w-0">
						{activeTab === "automation" ? (
							<>
								<button
									type="button"
									className="font-medium text-text bg-transparent border-none p-0 cursor-pointer hover:text-text-muted"
									onClick={backToAutomationList}
								>
									Automations
								</button>
								<span className="text-text-muted">›</span>
								{automationView === "list" ? (
									<span className="font-semibold text-text">
										My Automations
									</span>
								) : (
									<>
										<span className="text-text-muted">...</span>
										<span className="text-text-muted">›</span>
										<span className="font-semibold text-text">
											{activeAutomationName}
										</span>
										<button
											type="button"
											className="h-6 w-6 rounded-md border border-border bg-surface text-text-muted cursor-pointer hover:text-text hover:border-border-hover transition-colors"
											title="Rename flow"
										>
											✎
										</button>
										<span className="ml-1 inline-flex items-center rounded-md border border-red/50 bg-red/12 text-red px-2 py-0.5 text-[11px] font-semibold tracking-wide">
											LIVE
										</span>
									</>
								)}
							</>
						) : (
							<span className="font-medium text-text">
								{activeWorkspaceLabel}
							</span>
						)}
					</div>

					<div className="hidden md:flex items-center gap-2">
						{activeTab === "automation" && automationView === "builder" ? (
							<>
								<button
									className={`h-7 px-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
										previewMode
											? "border-accent/70 bg-accent/15 text-text hover:bg-accent/25"
											: "border-border bg-surface text-text hover:border-border-hover"
									}`}
									onClick={togglePreviewMode}
								>
									{previewMode ? "Edit Mode" : "Preview"}
								</button>
								<button className="h-7 px-2.5 rounded-lg border border-accent/70 bg-accent/15 text-xs text-text font-semibold cursor-pointer hover:bg-accent/25">
									Saved
								</button>
							</>
						) : null}
					</div>
				</header>

				<div className="flex flex-1 min-h-0 max-lg:flex-col">
					<Sidebar />
					{activeTab === "automation" && automationView === "builder" ? (
						<>
							<NodeEditor />
							<FlowCanvas />
						</>
					) : null}
					{activeTab === "automation" && automationView === "list" ? (
						<AutomationWorkspace
							onOpenAutomation={(automation) => {
								openAutomationBuilder(automation);
							}}
						/>
					) : null}
					{activeTab === "contacts" ? <ContactsWorkspace /> : null}
					{activeTab === "home" ? (
						<main className="flex-1 min-w-0 min-h-0 overflow-auto bg-bg p-6">
							<div className="mx-auto max-w-6xl space-y-5">
								<section className="rounded-2xl border border-border bg-surface p-5">
									<h2 className="m-0 text-xl font-semibold text-text">
										Overview
									</h2>
									<p className="m-0 mt-1 text-sm text-text-muted">
										Operational summary across your workspace.
									</p>
									<div className="mt-4 grid gap-3 sm:grid-cols-2">
										<div className="rounded-xl border border-border bg-bg/70 p-4">
											<p className="m-0 text-[11px] text-text-muted uppercase tracking-[0.14em]">
												Active Flows
											</p>
											<p className="m-0 mt-1 text-2xl font-semibold text-text">
												{Math.max(nodes.length - 1, 1)}
											</p>
										</div>
										<div className="rounded-xl border border-border bg-bg/70 p-4">
											<p className="m-0 text-[11px] text-text-muted uppercase tracking-[0.14em]">
												Connections
											</p>
											<p className="m-0 mt-1 text-2xl font-semibold text-text">
												{edges.length}
											</p>
										</div>
									</div>
								</section>

								<section className="rounded-2xl border border-border bg-surface p-5">
									<h3 className="m-0 text-sm uppercase tracking-[0.14em] text-text-muted">
										Quick Actions
									</h3>
									<div className="mt-3 flex flex-wrap gap-2">
										<button className="h-9 px-3 rounded-lg border border-accent/70 bg-accent/15 text-text text-sm font-semibold cursor-pointer transition-all hover:bg-accent/25">
											Create New Flow
										</button>
										<button className="h-9 px-3 rounded-lg border border-border bg-surface-2 text-text text-sm cursor-pointer transition-all hover:border-border-hover hover:bg-bg">
											View Last Conversation
										</button>
									</div>
								</section>
							</div>
						</main>
					) : null}
					{activeTab === "inbox" ? (
						<main className="flex-1 min-w-0 min-h-0 overflow-auto bg-bg p-6">
							<div className="mx-auto max-w-6xl space-y-5">
								<section className="rounded-2xl border border-border bg-surface p-5">
									<h2 className="m-0 text-xl font-semibold text-text">Inbox</h2>
									<p className="m-0 mt-1 text-sm text-text-muted">
										Manage conversations and assignment workflow.
									</p>
								</section>
								<section className="rounded-2xl border border-border bg-surface p-5">
									<h3 className="m-0 text-sm uppercase tracking-[0.14em] text-text-muted">
										Inbox Queue
									</h3>
									<div className="mt-3 rounded-xl border border-border bg-bg/70 p-4">
										<p className="m-0 text-sm font-semibold text-text">
											No unread conversations
										</p>
										<p className="m-0 mt-1 text-xs text-text-muted">
											When users reply, threads will appear here.
										</p>
									</div>
								</section>
							</div>
						</main>
					) : null}
					{activeTab === "broadcasts" ? (
						<main className="flex-1 min-w-0 min-h-0 overflow-auto bg-bg p-6">
							<div className="mx-auto max-w-6xl space-y-5">
								<section className="rounded-2xl border border-border bg-surface p-5">
									<h2 className="m-0 text-xl font-semibold text-text">
										Broadcasts
									</h2>
									<p className="m-0 mt-1 text-sm text-text-muted">
										Compose and schedule campaigns.
									</p>
								</section>
								<section className="rounded-2xl border border-border bg-surface p-5">
									<h3 className="m-0 text-sm uppercase tracking-[0.14em] text-text-muted">
										Broadcast Composer
									</h3>
									<textarea
										className="mt-3 w-full p-2.5 bg-bg border border-border rounded-lg text-text text-[13px] outline-none resize-y font-sans transition-colors focus:border-accent"
										rows={5}
										placeholder="Write your campaign message..."
									/>
									<div className="mt-3 flex flex-wrap items-center gap-2">
										<select className="h-9 min-w-56 px-2.5 bg-bg border border-border rounded-lg text-text text-[13px] outline-none transition-colors focus:border-accent font-sans">
											<option>All subscribers</option>
											<option>New leads (7 days)</option>
											<option>VIP segment</option>
										</select>
										<button className="h-9 px-3 rounded-lg border border-accent/70 bg-accent/15 text-text text-sm font-semibold cursor-pointer transition-all hover:bg-accent/25">
											Schedule Broadcast
										</button>
									</div>
								</section>
							</div>
						</main>
					) : null}
					{activeTab === "settings" ? (
						<main className="flex-1 min-w-0 min-h-0 overflow-auto bg-bg p-6">
							<div className="mx-auto max-w-6xl space-y-5">
								<section className="rounded-2xl border border-border bg-surface p-5">
									<h2 className="m-0 text-xl font-semibold text-text">
										Settings
									</h2>
									<p className="m-0 mt-1 text-sm text-text-muted">
										Workspace preferences, billing, and integrations.
									</p>
								</section>

								<section className="rounded-2xl border border-border bg-surface p-5">
									<h3 className="m-0 text-sm uppercase tracking-[0.14em] text-text-muted">
										Workspace Settings
									</h3>
									<div className="mt-3 grid gap-2 sm:grid-cols-2">
										<label className="rounded-xl border border-border bg-bg/70 p-3 text-xs flex items-center justify-between">
											<span>Enable flow autosave</span>
											<input type="checkbox" defaultChecked />
										</label>
										<label className="rounded-xl border border-border bg-bg/70 p-3 text-xs flex items-center justify-between">
											<span>Notify on publish</span>
											<input type="checkbox" defaultChecked />
										</label>
									</div>
								</section>

								<section className="rounded-2xl border border-border bg-surface p-5">
									<div className="flex items-center justify-between gap-2">
										<h3 className="m-0 text-sm uppercase tracking-[0.14em] text-text-muted">
											Billing · Subscriptions
										</h3>
										<span className="text-[10px] px-1.5 py-0.5 rounded border border-border bg-bg text-text-muted">
											FREE
										</span>
									</div>

									<div className="mt-3 rounded-xl border border-border bg-bg/60 overflow-x-auto">
										<div className="min-w-[640px]">
											<div className="grid grid-cols-[1.6fr_1.2fr_0.8fr_0.9fr] gap-2 px-3 py-2 border-b border-border text-[10px] uppercase tracking-[0.12em] text-text-muted">
												<span>Product</span>
												<span>Details</span>
												<span>Price</span>
												<span>Action</span>
											</div>

											<div className="grid grid-cols-[1.6fr_1.2fr_0.8fr_0.9fr] gap-2 px-3 py-2.5 border-b border-border text-[12px] items-center">
												<div className="font-semibold">
													Marketing Automation
												</div>
												<div className="text-text-muted">
													2500 contacts included
												</div>
												<div className="font-semibold">$25/mo</div>
												<button className="h-7 rounded-md border border-border bg-surface-2 text-text-muted text-xs cursor-pointer hover:border-border-hover">
													Activate
												</button>
											</div>

											<div className="grid grid-cols-[1.6fr_1.2fr_0.8fr_0.9fr] gap-2 px-3 py-2.5 border-b border-border text-[12px] items-center">
												<div className="font-semibold">Inbox</div>
												<div className="text-text-muted">Inbox seats</div>
												<div className="font-semibold">$99/mo</div>
												<button className="h-7 rounded-md border border-border bg-surface-2 text-text-muted text-xs cursor-pointer hover:border-border-hover">
													Activate
												</button>
											</div>

											<div className="grid grid-cols-[1.6fr_1.2fr_0.8fr_0.9fr] gap-2 px-3 py-2.5 text-[12px] items-center bg-surface/40">
												<div className="font-semibold">Manychat AI</div>
												<div className="text-text-muted">AI Automations</div>
												<div className="font-semibold">$29/mo</div>
												<button className="h-7 rounded-md border border-border bg-surface-2 text-text-muted text-xs cursor-pointer hover:border-border-hover">
													Activate
												</button>
											</div>
										</div>
									</div>

									<p className="m-0 mt-2 text-[11px] text-text-muted">
										Free contacts usage:{" "}
										<span className="text-text font-semibold">1088 / 1000</span>
									</p>
									<div className="mt-2 flex justify-end">
										<button className="h-8 px-3 rounded-lg border border-accent/70 bg-accent/15 text-text text-xs font-semibold cursor-pointer hover:bg-accent/25">
											Start Free Trial
										</button>
									</div>
								</section>

								<section className="rounded-2xl border border-border bg-surface p-5">
									<h3 className="m-0 text-sm uppercase tracking-[0.14em] text-text-muted">
										Integrations
									</h3>
									<div className="mt-3">
										<FacebookConnector />
									</div>
								</section>

								<section className="rounded-2xl border border-red/40 bg-red/6 p-5">
									<h3 className="m-0 text-sm uppercase tracking-[0.14em] text-red">
										Danger Zone
									</h3>
									<button className="mt-3 h-9 px-3 rounded-lg border border-red/60 bg-red/10 text-red text-xs font-semibold cursor-pointer transition-all hover:bg-red/20">
										Archive Workspace
									</button>
								</section>
							</div>
						</main>
					) : null}
					{activeTab !== "automation" &&
					activeTab !== "contacts" &&
					activeTab !== "home" &&
					activeTab !== "inbox" &&
					activeTab !== "broadcasts" &&
					activeTab !== "settings" ? (
						<main className="flex-1 min-w-0 min-h-0 flex items-center justify-center bg-[#f4f7fb]">
							<div className="text-center max-w-md px-6">
								<h2 className="m-0 text-2xl text-[#1f2937]">
									{activeTab} workspace
								</h2>
							</div>
						</main>
					) : null}
				</div>
			</div>
		</ReactFlowProvider>
	);
}
