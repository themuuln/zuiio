"use client";

import { useEffect, useRef, useState } from "react";
import type { Contact } from "@/types/contact";

type ContactResponse = {
	contacts: Contact[];
	total: number;
	error?: string;
};

type ContactDetailResponse = {
	contact?: Contact;
	error?: string;
};

const STATUS_OPTIONS = [
	{ label: "All statuses", value: "all" },
	{ label: "Subscribed", value: "subscribed" },
	{ label: "Unsubscribed", value: "unsubscribed" },
] as const;

const GENDER_OPTIONS = [
	{ label: "All genders", value: "all" },
	{ label: "Female", value: "female" },
	{ label: "Male", value: "male" },
	{ label: "Unknown", value: "unknown" },
] as const;

function formatRelativeDate(isoDate: string) {
	const timestamp = new Date(isoDate).getTime();
	if (Number.isNaN(timestamp)) return "Unknown";

	const diff = Date.now() - timestamp;
	const months = Math.floor(diff / (30 * 24 * 60 * 60 * 1000));
	if (months <= 0) return "This month";
	if (months === 1) return "1 month ago";
	return `${months} months ago`;
}

function Avatar({ contact }: { contact: Contact }) {
	if (contact.avatarUrl) {
		return (
			<img
				src={contact.avatarUrl}
				alt={contact.fullName}
				className="h-9 w-9 rounded-full object-cover border border-[#d6deea]"
			/>
		);
	}

	const initials =
		`${contact.firstName?.[0] ?? ""}${contact.lastName?.[0] ?? ""}`.toUpperCase() ||
		"U";
	return (
		<div className="h-9 w-9 rounded-full border border-[#d6deea] bg-[#eef3fb] text-[#60708a] text-[11px] font-semibold flex items-center justify-center">
			{initials}
		</div>
	);
}

export function ContactsWorkspace() {
	const [contacts, setContacts] = useState<Contact[]>([]);
	const [total, setTotal] = useState(0);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [query, setQuery] = useState("");
	const [debouncedQuery, setDebouncedQuery] = useState("");
	const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const [status, setStatus] = useState("all");
	const [gender, setGender] = useState("all");
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
	const [detailLoading, setDetailLoading] = useState(false);
	const [newTag, setNewTag] = useState("");

	// Debounce search query (300ms)
	useEffect(() => {
		if (debounceTimer.current) clearTimeout(debounceTimer.current);
		debounceTimer.current = setTimeout(() => {
			setDebouncedQuery(query);
		}, 300);
		return () => {
			if (debounceTimer.current) clearTimeout(debounceTimer.current);
		};
	}, [query]);

	useEffect(() => {
		const controller = new AbortController();

		const run = async () => {
			setLoading(true);
			setError(null);
			try {
				const params = new URLSearchParams({
					query: debouncedQuery,
					status,
					gender,
					limit: "100",
					offset: "0",
				});
				const response = await fetch(`/api/contacts?${params.toString()}`, {
					signal: controller.signal,
					cache: "no-store",
				});
				const data = (await response.json()) as ContactResponse;
				if (!response.ok) {
					setError(data.error ?? "Failed to load contacts.");
					setContacts([]);
					setTotal(0);
					return;
				}
				setContacts(data.contacts);
				setTotal(data.total);
			} catch (fetchError) {
				if ((fetchError as { name?: string }).name !== "AbortError") {
					setError("Failed to load contacts.");
				}
			} finally {
				setLoading(false);
			}
		};

		run();
		return () => controller.abort();
	}, [debouncedQuery, status, gender]);

	useEffect(() => {
		if (!selectedId) return;
		const controller = new AbortController();

		const run = async () => {
			setDetailLoading(true);
			try {
				const response = await fetch(`/api/contacts/${selectedId}`, {
					signal: controller.signal,
					cache: "no-store",
				});
				const data = (await response.json()) as ContactDetailResponse;
				if (!response.ok || !data.contact) {
					setSelectedContact(null);
					return;
				}
				setSelectedContact(data.contact);
			} finally {
				setDetailLoading(false);
			}
		};

		run();
		return () => controller.abort();
	}, [selectedId]);

	const closeDetail = () => {
		setSelectedId(null);
		setSelectedContact(null);
		setNewTag("");
	};

	const updateSelectedContact = async (patch: {
		tags?: string[];
		pausedAutomations?: boolean;
		status?: "subscribed" | "unsubscribed";
	}) => {
		if (!selectedContact) return;
		const response = await fetch(`/api/contacts/${selectedContact.id}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(patch),
		});
		const data = (await response.json()) as ContactDetailResponse;
		if (!response.ok || !data.contact) return;
		setSelectedContact(data.contact);
		setContacts((prev) =>
			prev.map((item) => (item.id === data.contact?.id ? data.contact : item)),
		);
	};

	const handleAddTag = async () => {
		const tag = newTag.trim();
		if (!tag || !selectedContact) return;
		if (selectedContact.tags.includes(tag)) {
			setNewTag("");
			return;
		}
		await updateSelectedContact({ tags: [...selectedContact.tags, tag] });
		setNewTag("");
	};

	const removeTag = async (tag: string) => {
		if (!selectedContact) return;
		await updateSelectedContact({
			tags: selectedContact.tags.filter((t) => t !== tag),
		});
	};

	return (
		<div className="flex-1 min-w-0 min-h-0 bg-[#f5f7fb] flex">
			<aside className="w-[300px] min-w-[300px] border-r border-[#e3e8f2] bg-[#f0f3f8] p-4 overflow-y-auto">
				<h2 className="text-[26px] font-semibold text-[#1f2937] m-0 mb-3">
					Contacts
				</h2>

				<section className="mb-4">
					<div className="flex items-center justify-between text-[12px] font-semibold text-[#4b5563] mb-2">
						<span>Segments</span>
						<span className="text-[10px] text-white bg-[#4f6df5] px-1.5 py-0.5 rounded">
							PRO
						</span>
					</div>
					<p className="text-[12px] text-[#79869a] m-0">
						Apply filter(s) to your contacts to create your first Segment
					</p>
				</section>

				<section className="mb-4">
					<h3 className="text-[12px] text-[#4b5563] m-0 mb-2 font-semibold">
						Tags
					</h3>
					<ul className="m-0 p-0 list-none text-[12px] text-[#596579] leading-6">
						<li>Ordered</li>
						<li>VIP</li>
						<li>Needs follow-up</li>
					</ul>
				</section>

				<section className="mb-4">
					<h3 className="text-[12px] text-[#4b5563] m-0 mb-2 font-semibold">
						Widgets
					</h3>
					<ul className="m-0 p-0 list-none text-[12px] text-[#596579] leading-6">
						<li>Facebook Comments #1</li>
						<li>Facebook Comments #3</li>
					</ul>
				</section>

				<section>
					<h3 className="text-[12px] text-[#4b5563] m-0 mb-2 font-semibold">
						Subscription Lists
					</h3>
					<ul className="m-0 p-0 list-none text-[12px] text-[#596579] leading-6">
						<li>Promo & Updates</li>
					</ul>
				</section>
			</aside>

			<main className="flex-1 min-w-0 min-h-0 flex flex-col">
				<div className="h-14 px-4 border-b border-[#e3e8f2] bg-white flex items-center justify-between gap-3">
					<h1 className="m-0 text-[22px] font-semibold text-[#202733]">
						Contacts
					</h1>
					<div className="flex items-center gap-2">
						<button className="h-8 px-3 rounded-md border border-[#d4ddeb] text-[12px] bg-white text-[#374151]">
							Create New Contact
						</button>
						<button className="h-8 px-3 rounded-md border border-[#4f6df5] text-[12px] bg-[#4f6df5] text-white">
							Import
						</button>
					</div>
				</div>

				<div className="h-14 px-4 border-b border-[#e3e8f2] bg-white flex items-center gap-2">
					<input
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						placeholder="Search by name or PSID"
						className="h-9 w-[280px] rounded-md border border-[#d4ddeb] bg-white px-3 text-[13px] text-[#1f2937] outline-none focus:border-[#4f6df5]"
					/>
					<select
						value={status}
						onChange={(event) => setStatus(event.target.value)}
						className="h-9 rounded-md border border-[#d4ddeb] bg-white px-2 text-[12px] text-[#374151] outline-none focus:border-[#4f6df5]"
					>
						{STATUS_OPTIONS.map((item) => (
							<option key={item.value} value={item.value}>
								{item.label}
							</option>
						))}
					</select>
					<select
						value={gender}
						onChange={(event) => setGender(event.target.value)}
						className="h-9 rounded-md border border-[#d4ddeb] bg-white px-2 text-[12px] text-[#374151] outline-none focus:border-[#4f6df5]"
					>
						{GENDER_OPTIONS.map((item) => (
							<option key={item.value} value={item.value}>
								{item.label}
							</option>
						))}
					</select>
					<div className="ml-auto flex items-center gap-1.5 text-[12px] text-[#7b8798]">
						{loading ? (
							<>
								<div className="h-3 w-3 animate-spin rounded-full border border-border border-t-accent" />
								<span>Loading…</span>
							</>
						) : (
							<span>
								{contacts.length} of {total} contacts
							</span>
						)}
					</div>
				</div>

				<div className="flex-1 min-h-0 overflow-auto">
					<table className="w-full border-collapse bg-white">
						<thead className="sticky top-0 bg-white">
							<tr className="text-left text-[12px] text-[#6b7280] border-b border-[#e3e8f2]">
								<th className="px-3 py-2 font-semibold w-[32px]"> </th>
								<th className="px-3 py-2 font-semibold w-[62px]">Avatar</th>
								<th className="px-3 py-2 font-semibold">Name</th>
								<th className="px-3 py-2 font-semibold w-[120px]">Gender</th>
								<th className="px-3 py-2 font-semibold w-[140px]">Status</th>
								<th className="px-3 py-2 font-semibold w-[160px]">
									Subscribed
								</th>
							</tr>
						</thead>
						<tbody>
							{error ? (
								<tr>
									<td
										colSpan={6}
										className="px-4 py-6 text-[13px] text-[#b42318]"
									>
										{error}
									</td>
								</tr>
							) : null}
							{!error && contacts.length === 0 && !loading ? (
								<tr>
									<td
										colSpan={6}
										className="px-4 py-8 text-[13px] text-[#7b8798]"
									>
										No contacts found for the current filters.
									</td>
								</tr>
							) : null}
							{contacts.map((contact) => (
								<tr
									key={contact.id}
									onClick={() => setSelectedId(contact.id)}
									className="border-b border-[#eef2f7] text-[13px] text-[#1f2937] hover:bg-[#f8fafe] cursor-pointer"
								>
									<td className="px-3 py-2 align-middle">
										<input
											type="checkbox"
											aria-label={`Select ${contact.fullName}`}
										/>
									</td>
									<td className="px-3 py-2 align-middle">
										<Avatar contact={contact} />
									</td>
									<td className="px-3 py-2 align-middle">{contact.fullName}</td>
									<td className="px-3 py-2 align-middle capitalize">
										{contact.gender}
									</td>
									<td className="px-3 py-2 align-middle capitalize">
										{contact.status}
									</td>
									<td className="px-3 py-2 align-middle text-[#6b7280]">
										{formatRelativeDate(contact.subscribedAt)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</main>

			{selectedId ? (
				<div
					className="fixed inset-0 z-40 bg-black/45 flex items-center justify-center p-6"
					onClick={closeDetail}
				>
					<div
						className="w-full max-w-[860px] min-h-[560px] rounded-xl bg-white text-[#1f2937] shadow-2xl border border-[#dbe4f2] flex"
						onClick={(event) => event.stopPropagation()}
					>
						<div className="w-[340px] border-r border-[#e4e9f3] p-6">
							{selectedContact ? (
								<>
									<div className="h-[200px] rounded-xl border border-[#d7deec] bg-[#e5ebf7] mb-6 flex items-center justify-center text-[#7f8ca6]">
										<Avatar contact={selectedContact} />
									</div>
									<button
										className="w-full h-10 rounded-md border border-[#c6d0e2] text-[28px] leading-none text-[#38465b] bg-white"
										onClick={() =>
											updateSelectedContact({
												pausedAutomations: !selectedContact.pausedAutomations,
											})
										}
									>
										{selectedContact.pausedAutomations ? "▷" : "Ⅱ"}
										<span className="text-[15px] ml-2 align-middle">
											{selectedContact.pausedAutomations
												? "Resume Automations"
												: "Pause Automations"}
										</span>
									</button>

									<div className="mt-6 text-[28px] text-[#4f6df5]">
										<button className="w-full h-11 rounded-md bg-[#4f6df5] text-white text-[24px]">
											Start Chat
										</button>
									</div>
								</>
							) : (
								<p className="text-[13px] text-[#6b7280]">
									{detailLoading ? "Loading..." : "Contact not found."}
								</p>
							)}
						</div>

						<div className="flex-1 p-6">
							<div className="flex items-start justify-between mb-4">
								<h2 className="m-0 text-[38px] font-semibold">
									{selectedContact?.fullName ??
										(detailLoading ? "Loading..." : "Unknown contact")}
								</h2>
								<button
									className="text-[28px] text-[#445066] bg-transparent border-0 cursor-pointer"
									onClick={closeDetail}
								>
									×
								</button>
							</div>

							{selectedContact ? (
								<>
									<div className="border-t border-[#e4e9f3] pt-4">
										<div className="flex items-center justify-between mb-2">
											<span className="text-[16px] font-semibold">
												Contact Tags
											</span>
										</div>
										<div className="flex flex-wrap gap-2 mb-2">
											{selectedContact.tags.map((tag) => (
												<button
													key={tag}
													className="px-2 py-1 rounded-full border border-[#cad6ee] bg-[#eef3ff] text-[#4f6df5] text-[12px]"
													onClick={() => removeTag(tag)}
												>
													{tag} ×
												</button>
											))}
										</div>
										<div className="flex gap-2">
											<input
												value={newTag}
												onChange={(event) => setNewTag(event.target.value)}
												placeholder="Add tag"
												className="h-9 flex-1 rounded-md border border-[#d4ddeb] px-3 text-[13px] outline-none focus:border-[#4f6df5]"
											/>
											<button
												className="h-9 px-3 rounded-md bg-[#4f6df5] text-white text-[12px]"
												onClick={handleAddTag}
											>
												+ Add Tag
											</button>
										</div>
									</div>

									<div className="border-t border-[#e4e9f3] mt-5 pt-4">
										<div className="text-[16px] font-semibold mb-2">
											Subscribed to Sequences
										</div>
										{selectedContact.subscriptionLists.length > 0 ? (
											<div className="flex flex-wrap gap-2">
												{selectedContact.subscriptionLists.map((item) => (
													<span
														key={item}
														className="px-2 py-1 rounded-full border border-[#dae3f4] bg-[#f5f8ff] text-[#51607a] text-[12px]"
													>
														{item}
													</span>
												))}
											</div>
										) : (
											<div className="text-[13px] text-[#7a879a]">
												No sequences
											</div>
										)}
									</div>

									<div className="border-t border-[#e4e9f3] mt-5 pt-4">
										<div className="text-[16px] font-semibold mb-2">
											Opted In through
										</div>
										<span className="px-2 py-1 rounded-full border border-[#cad6ee] bg-[#eef3ff] text-[#51607a] text-[12px]">
											{selectedContact.optedInThrough}
										</span>
									</div>

									<div className="border-t border-[#e4e9f3] mt-5 pt-4">
										<div className="text-[16px] font-semibold mb-3">
											System Fields
										</div>
										<div className="grid grid-cols-2 gap-2">
											<div className="rounded-xl border border-[#d8e1f1] bg-[#f3f7ff] p-3">
												<div className="text-[11px] text-[#67778f]">
													First Name
												</div>
												<div className="text-[14px]">
													{selectedContact.firstName}
												</div>
											</div>
											<div className="rounded-xl border border-[#d8e1f1] bg-[#f3f7ff] p-3">
												<div className="text-[11px] text-[#67778f]">
													Last Name
												</div>
												<div className="text-[14px]">
													{selectedContact.lastName}
												</div>
											</div>
											<div className="rounded-xl border border-[#d8e1f1] bg-[#f3f7ff] p-3">
												<div className="text-[11px] text-[#67778f]">Gender</div>
												<div className="text-[14px] capitalize">
													{selectedContact.gender}
												</div>
											</div>
											<div className="rounded-xl border border-[#d8e1f1] bg-[#f3f7ff] p-3">
												<div className="text-[11px] text-[#67778f]">PSID</div>
												<div
													className="text-[14px] truncate"
													title={selectedContact.psid}
												>
													{selectedContact.psid}
												</div>
											</div>
										</div>
									</div>
								</>
							) : (
								<p className="text-[13px] text-[#6b7280]">
									{detailLoading ? "Loading details..." : "Contact not found."}
								</p>
							)}
						</div>
					</div>
				</div>
			) : null}
		</div>
	);
}
