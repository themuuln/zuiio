"use client";

import { useCallback, useRef, useMemo, useState, useEffect } from "react";
import {
	ReactFlow,
	Background,
	Controls,
	MiniMap,
	BackgroundVariant,
	PanOnScrollMode,
	type FinalConnectionState,
	type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import {
	StartNode,
	SendMessageNode,
	AskQuestionNode,
	ConditionNode,
	SetFieldNode,
	DelayNode,
	ActionNode,
	CardCarouselNode,
} from "@/components/nodes";
import { useFlowStore } from "@/store/flowStore";
import { useUiStore } from "@/store/uiStore";
import { NODE_TEMPLATES } from "@/store/defaults";
import { createAutoLayoutPositions } from "@/lib/flowLayout";
import type { FlowNode, FlowEdge, FlowNodeType } from "@/types/flow";

interface PendingAddMenu {
	screenX: number;
	screenY: number;
	flowX: number;
	flowY: number;
	sourceNodeId: string;
	sourceHandle: string | null;
}

interface FlowContextMenu {
	screenX: number;
	screenY: number;
	flowX: number;
	flowY: number;
	nodeId?: string;
	nodeType?: FlowNodeType;
}

function getClientPoint(
	event: MouseEvent | TouchEvent,
): { x: number; y: number } | null {
	if ("changedTouches" in event) {
		const touch = event.changedTouches[0];
		if (!touch) return null;
		return { x: touch.clientX, y: touch.clientY };
	}
	return { x: event.clientX, y: event.clientY };
}

export function FlowCanvas() {
	const AUTO_LAYOUT_ANIMATION_MS = 420;
	const AUTO_SAVE_DEBOUNCE_MS = 1800;
	const reactFlowWrapper = useRef<HTMLDivElement>(null);
	const reactFlowInstance = useRef<ReactFlowInstance<
		FlowNode,
		FlowEdge
	> | null>(null);
	const autoLayoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const isHydratingFlowRef = useRef(false);
	const lastSavedVersionRef = useRef(-1);
	const ignoreNextPaneClickRef = useRef(false);
	const [pendingAddMenu, setPendingAddMenu] = useState<PendingAddMenu | null>(
		null,
	);
	const [quickAddOpen, setQuickAddOpen] = useState(false);
	const [contextMenu, setContextMenu] = useState<FlowContextMenu | null>(null);

	const nodes = useFlowStore((s) => s.nodes);
	const edges = useFlowStore((s) => s.edges);
	const version = useFlowStore((s) => s.version);
	const onNodesChange = useFlowStore((s) => s.onNodesChange);
	const onEdgesChange = useFlowStore((s) => s.onEdgesChange);
	const onConnect = useFlowStore((s) => s.onConnect);
	const addNode = useFlowStore((s) => s.addNode);
	const setNodePositions = useFlowStore((s) => s.setNodePositions);
	const setNodeTransitionStyle = useFlowStore((s) => s.setNodeTransitionStyle);
	const selectNode = useFlowStore((s) => s.selectNode);
	const undo = useFlowStore((s) => s.undo);
	const redo = useFlowStore((s) => s.redo);
	const duplicateNode = useFlowStore((s) => s.duplicateNode);
	const deleteNode = useFlowStore((s) => s.deleteNode);
	const canUndo = useFlowStore((s) => s.past.length > 0);
	const canRedo = useFlowStore((s) => s.future.length > 0);
	const exportFlow = useFlowStore((s) => s.exportFlow);
	const importFlow = useFlowStore((s) => s.importFlow);
	const activeAutomationId = useUiStore((s) => s.activeAutomationId);
	const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
	const [publishing, setPublishing] = useState(false);
	const [publishStatus, setPublishStatus] = useState<string | null>(null);
	const [autoSaveStatus, setAutoSaveStatus] = useState<string | null>(
		"Auto-save on",
	);
	const [syncedVersion, setSyncedVersion] = useState(-1);

	useEffect(() => {
		return () => {
			if (autoLayoutTimerRef.current) clearTimeout(autoLayoutTimerRef.current);
			if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
		};
	}, []);

	useEffect(() => {
		if (!activeAutomationId) return;

		isHydratingFlowRef.current = true;
		setAutoSaveStatus("Loading flow...");

		void (async () => {
			try {
				const response = await fetch(
					`/api/automations/${activeAutomationId}/flow`,
					{
						cache: "no-store",
					},
				);
				const result = (await response.json()) as {
					error?: string;
					flow?: { nodes?: FlowNode[]; edges?: FlowEdge[] };
				};
				if (!response.ok) {
					setAutoSaveStatus(result.error ?? "Failed to load flow");
					isHydratingFlowRef.current = false;
					return;
				}

				const nextNodes = Array.isArray(result.flow?.nodes)
					? result.flow?.nodes
					: [];
				const nextEdges = Array.isArray(result.flow?.edges)
					? result.flow?.edges
					: [];
				if (nextNodes && nextEdges) {
					importFlow({ nodes: nextNodes, edges: nextEdges });
				}

				requestAnimationFrame(() => {
					const currentVersion = useFlowStore.getState().version;
					lastSavedVersionRef.current = currentVersion;
					setSyncedVersion(currentVersion);
					setAutoSaveStatus("Automation loaded");
					isHydratingFlowRef.current = false;
				});
			} catch {
				setAutoSaveStatus("Failed to load flow");
				isHydratingFlowRef.current = false;
			}
		})();
	}, [activeAutomationId, importFlow]);

	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			const key = event.key.toLowerCase();
			const isMeta = event.metaKey || event.ctrlKey;
			if (!isMeta) return;

			if (key === "z" && !event.shiftKey) {
				event.preventDefault();
				undo();
				return;
			}

			if ((key === "z" && event.shiftKey) || key === "y") {
				event.preventDefault();
				redo();
			}
		};

		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [redo, undo]);

	const nodeTypes = useMemo(
		() => ({
			start: StartNode,
			sendMessage: SendMessageNode,
			askQuestion: AskQuestionNode,
			condition: ConditionNode,
			setField: SetFieldNode,
			delay: DelayNode,
			action: ActionNode,
			cardCarousel: CardCarouselNode,
		}),
		[],
	);

	const onDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.dataTransfer.dropEffect = "move";
	}, []);

	const onDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			const type = e.dataTransfer.getData(
				"application/reactflow",
			) as FlowNodeType;
			if (!type || !reactFlowInstance.current) return;

			const bounds = reactFlowWrapper.current?.getBoundingClientRect();
			if (!bounds) return;

			const position = reactFlowInstance.current.screenToFlowPosition({
				x: e.clientX - bounds.left,
				y: e.clientY - bounds.top,
			});

			addNode(type, position);
		},
		[addNode],
	);

	const onNodeClick = useCallback(
		(_: React.MouseEvent, node: { id: string }) => {
			ignoreNextPaneClickRef.current = false;
			setPendingAddMenu(null);
			setContextMenu(null);
			selectNode(node.id);
		},
		[selectNode],
	);

	const onPaneClick = useCallback(() => {
		if (ignoreNextPaneClickRef.current) {
			ignoreNextPaneClickRef.current = false;
			return;
		}

		setPendingAddMenu(null);
		setContextMenu(null);
		setQuickAddOpen(false);
		selectNode(null);
	}, [selectNode]);

	const onPaneContextMenu = useCallback(
		(event: MouseEvent | React.MouseEvent) => {
			event.preventDefault();
			const instance = reactFlowInstance.current;
			if (!instance) return;

			const flowPoint = instance.screenToFlowPosition({
				x: event.clientX,
				y: event.clientY,
			});

			setPendingAddMenu(null);
			setQuickAddOpen(false);
			setContextMenu({
				screenX: event.clientX,
				screenY: event.clientY,
				flowX: flowPoint.x,
				flowY: flowPoint.y,
			});
		},
		[],
	);

	const onNodeContextMenu = useCallback(
		(event: MouseEvent | React.MouseEvent, node: FlowNode) => {
			event.preventDefault();
			const instance = reactFlowInstance.current;
			if (!instance) return;

			const flowPoint = instance.screenToFlowPosition({
				x: event.clientX,
				y: event.clientY,
			});

			selectNode(node.id);
			setPendingAddMenu(null);
			setQuickAddOpen(false);
			setContextMenu({
				screenX: event.clientX,
				screenY: event.clientY,
				flowX: flowPoint.x,
				flowY: flowPoint.y,
				nodeId: node.id,
				nodeType: node.type,
			});
		},
		[selectNode],
	);

	const onConnectEnd = useCallback(
		(event: MouseEvent | TouchEvent, connectionState: FinalConnectionState) => {
			const point = getClientPoint(event);

			if (!point) {
				setPendingAddMenu(null);
				return;
			}

			const sourceNodeId = connectionState.fromNode?.id;
			if (!sourceNodeId || connectionState.isValid) {
				setPendingAddMenu(null);
				return;
			}

			const instance = reactFlowInstance.current;
			if (!instance) {
				setPendingAddMenu(null);
				return;
			}

			const flowPoint = instance.screenToFlowPosition({
				x: point.x,
				y: point.y,
			});

			setPendingAddMenu({
				screenX: point.x,
				screenY: point.y,
				flowX: flowPoint.x,
				flowY: flowPoint.y,
				sourceNodeId,
				sourceHandle: connectionState.fromHandle?.id ?? null,
			});
			ignoreNextPaneClickRef.current = true;
			setContextMenu(null);
		},
		[],
	);

	const handleMenuAddNode = useCallback(
		(type: FlowNodeType) => {
			if (!pendingAddMenu) return;

			const newNodeId = addNode(type, {
				x: pendingAddMenu.flowX + 24,
				y: pendingAddMenu.flowY - 32,
			});

			onConnect({
				source: pendingAddMenu.sourceNodeId,
				sourceHandle: pendingAddMenu.sourceHandle,
				target: newNodeId,
				targetHandle: "in",
			});

			setPendingAddMenu(null);
			setContextMenu(null);
			selectNode(newNodeId);
		},
		[addNode, onConnect, pendingAddMenu, selectNode],
	);

	const menuPosition = useMemo(() => {
		if (!pendingAddMenu) return null;
		const bounds = reactFlowWrapper.current?.getBoundingClientRect();
		if (!bounds) return null;
		return {
			left: pendingAddMenu.screenX - bounds.left,
			top: pendingAddMenu.screenY - bounds.top,
		};
	}, [pendingAddMenu]);

	const contextMenuPosition = useMemo(() => {
		if (!contextMenu) return null;
		const bounds = reactFlowWrapper.current?.getBoundingClientRect();
		if (!bounds) return null;
		return {
			left: contextMenu.screenX - bounds.left,
			top: contextMenu.screenY - bounds.top,
		};
	}, [contextMenu]);

	const handleExport = useCallback(() => {
		const data = exportFlow();
		const blob = new Blob([JSON.stringify(data, null, 2)], {
			type: "application/json",
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "flow.json";
		a.click();
		URL.revokeObjectURL(url);
	}, [exportFlow]);

	const handleImport = useCallback(() => {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = ".json";
		input.onchange = (e) => {
			const file = (e.target as HTMLInputElement).files?.[0];
			if (!file) return;
			const reader = new FileReader();
			reader.onload = (ev) => {
				try {
					const data = JSON.parse(ev.target?.result as string);
					if (data.nodes && data.edges) {
						importFlow(data);
					} else {
						setPublishStatus("Invalid flow file: missing nodes or edges.");
					}
				} catch {
					setPublishStatus("Invalid flow file: could not parse JSON.");
				}
			};
			reader.readAsText(file);
		};
		input.click();
	}, [importFlow]);

	const handlePublish = useCallback(async () => {
		if (version === syncedVersion) return;
		setPublishing(true);
		setPublishStatus(null);
		try {
			const data = exportFlow();
			const response = await fetch("/api/flow/publish", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			});

			const result = (await response.json()) as {
				error?: string;
				details?: string;
			};
			if (!response.ok) {
				const detail = result.details ? ` ${result.details}` : "";
				setPublishStatus(
					result.error ? `${result.error}${detail}` : "Publish failed.",
				);
				return;
			}

			setSyncedVersion(version);
			setPublishStatus("Published to Supabase.");
		} catch {
			setPublishStatus("Publish failed.");
		} finally {
			setPublishing(false);
		}
	}, [exportFlow, syncedVersion, version]);

	const saveFlow = useCallback(async () => {
		const data = exportFlow();
		const response = activeAutomationId
			? await fetch(`/api/automations/${activeAutomationId}/flow`, {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(data),
				})
			: await fetch("/api/flow/publish", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(data),
				});

		const result = (await response.json()) as {
			error?: string;
			details?: string;
		};
		if (!response.ok) {
			const detail = result.details ? ` ${result.details}` : "";
			throw new Error(
				result.error ? `${result.error}${detail}` : "Save failed.",
			);
		}
	}, [activeAutomationId, exportFlow]);

	const handleAutoLayout = useCallback(() => {
		const positionMap = createAutoLayoutPositions(nodes, edges);
		setNodeTransitionStyle(
			`transform ${AUTO_LAYOUT_ANIMATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
		);
		setNodePositions(positionMap);

		requestAnimationFrame(() => {
			reactFlowInstance.current?.fitView({
				duration: AUTO_LAYOUT_ANIMATION_MS,
				padding: 0.2,
			});
		});

		if (autoLayoutTimerRef.current) clearTimeout(autoLayoutTimerRef.current);
		autoLayoutTimerRef.current = setTimeout(() => {
			setNodeTransitionStyle(null);
			autoLayoutTimerRef.current = null;
		}, AUTO_LAYOUT_ANIMATION_MS + 40);
	}, [
		AUTO_LAYOUT_ANIMATION_MS,
		edges,
		nodes,
		setNodePositions,
		setNodeTransitionStyle,
	]);

	const handleContextAddNode = useCallback(
		(type: FlowNodeType) => {
			if (!contextMenu) return;
			const newNodeId = addNode(type, {
				x: contextMenu.flowX - 90,
				y: contextMenu.flowY - 40,
			});
			selectNode(newNodeId);
			setContextMenu(null);
		},
		[addNode, contextMenu, selectNode],
	);

	const addNodeAtViewportCenter = useCallback(
		(type: FlowNodeType) => {
			const instance = reactFlowInstance.current;
			const bounds = reactFlowWrapper.current?.getBoundingClientRect();
			if (!instance || !bounds) return;

			const center = instance.screenToFlowPosition({
				x: bounds.left + bounds.width / 2,
				y: bounds.top + bounds.height / 2,
			});

			const newNodeId = addNode(type, {
				x: center.x - 90,
				y: center.y - 60,
			});
			selectNode(newNodeId);
			setQuickAddOpen(false);
		},
		[addNode, selectNode],
	);

	useEffect(() => {
		if (!autoSaveEnabled) return;
		if (isHydratingFlowRef.current) return;
		if (version === lastSavedVersionRef.current) return;

		setAutoSaveStatus("Saving draft...");

		if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
		autoSaveTimerRef.current = setTimeout(async () => {
			try {
				await saveFlow();
				lastSavedVersionRef.current = version;
				setSyncedVersion(version);
				setAutoSaveStatus("Auto-saved");
			} catch {
				setAutoSaveStatus("Auto-save failed");
			} finally {
				autoSaveTimerRef.current = null;
			}
		}, AUTO_SAVE_DEBOUNCE_MS);

		return () => {
			if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
		};
	}, [AUTO_SAVE_DEBOUNCE_MS, autoSaveEnabled, saveFlow, version]);

	const isSyncedToSupabase = version === syncedVersion;

	return (
		<div ref={reactFlowWrapper} className="flex-1 h-full relative">
			<div className="absolute top-3 right-3 z-20 flex flex-col items-end gap-1.5">
				<div className="relative">
					<button
						type="button"
						className="h-14 w-14 rounded-full border border-accent/50 bg-accent/20 text-text text-3xl leading-none cursor-pointer shadow-[0_14px_32px_-16px_rgba(255,255,255,0.7)] hover:bg-accent/30 transition-colors"
						onClick={() => setQuickAddOpen((prev) => !prev)}
						title="Add step"
					>
						+
					</button>

					{quickAddOpen ? (
						<div className="absolute right-0 top-[72px] z-30 w-[360px] max-h-[calc(100vh-120px)] overflow-y-auto rounded-xl border border-border bg-surface p-4 shadow-2xl">
							<div className="flex flex-col gap-4">
								<section>
									<h4 className="m-0 text-base font-semibold text-text">
										Content
									</h4>
									<div className="mt-2 grid grid-cols-2 gap-2">
										{NODE_TEMPLATES.filter((t) =>
											["sendMessage", "askQuestion", "cardCarousel"].includes(
												t.type,
											),
										).map((tpl) => (
											<button
												key={tpl.type}
												type="button"
												className="text-left border border-dashed border-border rounded-lg p-2 bg-bg/60 hover:bg-surface-2 cursor-pointer transition-colors"
												onClick={() => addNodeAtViewportCenter(tpl.type)}
											>
												<div className="text-xs font-semibold text-text">
													{tpl.label}
												</div>
											</button>
										))}
									</div>
								</section>

								<section>
									<h4 className="m-0 text-base font-semibold text-text">
										Logic
									</h4>
									<div className="mt-2 grid grid-cols-2 gap-2">
										{NODE_TEMPLATES.filter((t) =>
											["condition", "delay", "setField", "action"].includes(
												t.type,
											),
										).map((tpl) => (
											<button
												key={tpl.type}
												type="button"
												className="text-left border border-dashed border-border rounded-lg p-2 bg-bg/60 hover:bg-surface-2 cursor-pointer transition-colors"
												onClick={() => addNodeAtViewportCenter(tpl.type)}
											>
												<div className="text-xs font-semibold text-text">
													{tpl.label}
												</div>
											</button>
										))}
									</div>
								</section>
							</div>
						</div>
					) : null}
				</div>

				<div className="flex items-center gap-1.5 rounded-2xl border border-border/70 bg-linear-to-br from-surface/95 to-surface-2/90 backdrop-blur-md px-1.5 py-1.5 shadow-[0_14px_32px_-18px_rgba(0,0,0,0.8)]">
					<button
						className="h-9 w-9 border border-border rounded-xl bg-surface text-text text-base font-semibold cursor-pointer transition-all hover:border-border-hover hover:bg-bg disabled:opacity-50 disabled:cursor-not-allowed"
						onClick={undo}
						title="Undo (Ctrl/Cmd+Z)"
						disabled={!canUndo}
					>
						↶
					</button>
					<button
						className="h-9 w-9 border border-border rounded-xl bg-surface text-text text-base font-semibold cursor-pointer transition-all hover:border-border-hover hover:bg-bg disabled:opacity-50 disabled:cursor-not-allowed"
						onClick={redo}
						title="Redo (Ctrl/Cmd+Shift+Z)"
						disabled={!canRedo}
					>
						↷
					</button>
					<button
						className="h-9 px-3 border border-border rounded-xl bg-surface text-text text-xs font-semibold cursor-pointer transition-all hover:border-border-hover hover:bg-bg"
						onClick={handleAutoLayout}
						title="Auto organize flow"
					>
						✨ Organize
					</button>
					<button
						className="h-9 px-2.5 border border-border rounded-xl bg-surface-2 text-text text-xs cursor-pointer transition-all hover:border-border-hover hover:bg-bg"
						onClick={handleExport}
						title="Export flow as JSON"
					>
						⭳ Export
					</button>
					<div className="relative">
						{isSyncedToSupabase ? (
							<span className="absolute -top-2 left-1/2 -translate-x-1/2 h-4 min-w-4 px-1 rounded-full border border-green/60 bg-green/15 text-green text-[10px] leading-4 text-center font-bold">
								✓
							</span>
						) : null}
						<button
							className="h-9 px-3 border border-accent/70 rounded-xl bg-accent/15 text-text text-xs font-semibold cursor-pointer transition-all hover:bg-accent/25 disabled:cursor-not-allowed disabled:opacity-60"
							onClick={handlePublish}
							disabled={publishing || isSyncedToSupabase}
							title={
								isSyncedToSupabase
									? "Already synced to Supabase"
									: "Save and publish flow"
							}
						>
							{publishing
								? "Publishing..."
								: isSyncedToSupabase
									? "Synced"
									: "Save"}
						</button>
					</div>
					<button
						className="h-9 px-2.5 border border-border rounded-xl bg-transparent text-text-muted text-xs cursor-pointer transition-all hover:border-border-hover hover:bg-bg"
						onClick={handleImport}
						title="Import flow from JSON"
					>
						⭱ Import
					</button>
					<button
						className={`h-9 px-2.5 border rounded-xl text-xs cursor-pointer transition-all ${
							autoSaveEnabled
								? "border-green/60 bg-green/10 text-green hover:bg-green/15"
								: "border-border bg-transparent text-text-muted hover:border-border-hover hover:bg-bg"
						}`}
						onClick={() =>
							setAutoSaveEnabled((prev) => {
								const next = !prev;
								setAutoSaveStatus(next ? "Auto-save on" : "Auto-save off");
								return next;
							})
						}
						title="Toggle auto-save"
					>
						Auto-save
					</button>
				</div>
				{publishStatus || autoSaveStatus ? (
					<div className="rounded-xl border border-border bg-surface/95 px-2.5 py-1.5 text-[11px] text-text-muted max-w-[320px] break-words shadow-lg">
						{publishStatus ?? autoSaveStatus}
					</div>
				) : null}
			</div>

			<ReactFlow
				nodes={nodes}
				edges={edges}
				onNodesChange={onNodesChange}
				onEdgesChange={onEdgesChange}
				onConnect={onConnect}
				onDragOver={onDragOver}
				onDrop={onDrop}
				onNodeClick={onNodeClick}
				onPaneClick={onPaneClick}
				onPaneContextMenu={onPaneContextMenu}
				onNodeContextMenu={onNodeContextMenu}
				onConnectEnd={onConnectEnd}
				onInit={(instance) => {
					reactFlowInstance.current = instance;
				}}
				nodeTypes={nodeTypes}
				fitView
				snapToGrid
				snapGrid={[16, 16]}
				defaultEdgeOptions={{
					type: "smoothstep",
					animated: false,
				}}
				zoomOnScroll={false}
				zoomOnPinch
				panOnScroll
				panOnScrollMode={PanOnScrollMode.Free}
				panOnScrollSpeed={1}
				deleteKeyCode={["Backspace", "Delete"]}
				proOptions={{ hideAttribution: true }}
			>
				<Background
					variant={BackgroundVariant.Dots}
					gap={20}
					size={1}
					color="var(--color-border)"
				/>
				<Controls position="bottom-left" />
				<MiniMap
					position="bottom-right"
					nodeColor={(n) => {
						switch (n.type) {
							case "start":
								return "var(--color-green)";
							case "sendMessage":
								return "var(--color-blue)";
							case "askQuestion":
								return "var(--color-yellow)";
							case "condition":
								return "var(--color-purple)";
							case "setField":
								return "var(--color-green)";
							case "delay":
								return "var(--color-orange)";
							case "action":
								return "var(--color-red)";
							case "cardCarousel":
								return "#ec4899";
							default:
								return "#666";
						}
					}}
					maskColor="rgba(0,0,0,0.7)"
				/>
			</ReactFlow>

			{menuPosition && (
				<div
					className="absolute z-20 min-w-[180px] bg-surface border border-border rounded-lg shadow-xl overflow-hidden"
					style={{ left: menuPosition.left, top: menuPosition.top }}
				>
					<div className="py-1">
						{NODE_TEMPLATES.map((tpl) => (
							<button
								key={tpl.type}
								className="w-full text-left px-3 py-2 text-sm text-text hover:bg-surface-2 border-none bg-transparent cursor-pointer"
								onClick={() => handleMenuAddNode(tpl.type)}
							>
								+ {tpl.label}
							</button>
						))}
						<button
							className="w-full text-left px-3 py-2 text-sm text-text-muted hover:bg-surface-2 border-none bg-transparent cursor-pointer border-t border-border"
							onClick={() => setPendingAddMenu(null)}
						>
							Cancel
						</button>
					</div>
				</div>
			)}

			{contextMenu && contextMenuPosition ? (
				<div
					className="absolute z-40 min-w-[180px] bg-surface border border-border rounded-lg shadow-2xl overflow-hidden"
					style={{
						left: contextMenuPosition.left,
						top: contextMenuPosition.top,
					}}
				>
					<div className="py-1">
						{contextMenu.nodeId ? (
							<>
								<button
									className="w-full text-left px-3 py-2 text-sm text-text hover:bg-surface-2 border-none bg-transparent cursor-pointer"
									onClick={() => {
										selectNode(contextMenu.nodeId as string);
										setContextMenu(null);
									}}
								>
									Edit Node
								</button>
								<button
									className="w-full text-left px-3 py-2 text-sm text-text hover:bg-surface-2 border-none bg-transparent cursor-pointer disabled:text-text-muted disabled:cursor-not-allowed"
									onClick={() => {
										if ((contextMenu.nodeType ?? "") === "start") return;
										const newId = duplicateNode(contextMenu.nodeId as string);
										if (newId) selectNode(newId);
										setContextMenu(null);
									}}
									disabled={(contextMenu.nodeType ?? "") === "start"}
								>
									Duplicate
								</button>
								<button
									className="w-full text-left px-3 py-2 text-sm text-red hover:bg-surface-2 border-none bg-transparent cursor-pointer disabled:text-text-muted disabled:cursor-not-allowed"
									onClick={() => {
										if ((contextMenu.nodeType ?? "") === "start") return;
										deleteNode(contextMenu.nodeId as string);
										setContextMenu(null);
									}}
									disabled={(contextMenu.nodeType ?? "") === "start"}
								>
									Delete
								</button>
							</>
						) : (
							<>
								{NODE_TEMPLATES.map((tpl) => (
									<button
										key={tpl.type}
										className="w-full text-left px-3 py-2 text-sm text-text hover:bg-surface-2 border-none bg-transparent cursor-pointer"
										onClick={() => handleContextAddNode(tpl.type)}
									>
										+ {tpl.label}
									</button>
								))}
								<button
									className="w-full text-left px-3 py-2 text-sm text-text hover:bg-surface-2 border-none bg-transparent cursor-pointer border-t border-border"
									onClick={() => {
										handleAutoLayout();
										setContextMenu(null);
									}}
								>
									✨ Organize
								</button>
							</>
						)}
					</div>
				</div>
			) : null}
		</div>
	);
}
