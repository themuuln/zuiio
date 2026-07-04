import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CSSProperties } from "react";
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  type Connection,
  type NodeChange,
  type EdgeChange,
} from "@xyflow/react";
import { nanoid } from "nanoid";
import type { FlowNode, FlowEdge, FlowNodeType, FlowNodeData } from "@/types/flow";
import { getDefaultData } from "./defaults";

interface FlowSnapshot {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

const HISTORY_LIMIT = 100;

interface FlowState {
  nodes: FlowNode[];
  edges: FlowEdge[];
  selectedNodeId: string | null;
  version: number;
  past: FlowSnapshot[];
  future: FlowSnapshot[];

  onNodesChange: (changes: NodeChange<FlowNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<FlowEdge>[]) => void;
  onConnect: (connection: Connection) => void;

  addNode: (type: FlowNodeType, position: { x: number; y: number }) => string;
  duplicateNode: (nodeId: string) => string | null;
  setNodePositions: (positions: Record<string, { x: number; y: number }>) => void;
  setNodeTransitionStyle: (transition: CSSProperties["transition"] | null) => void;
  updateNodeData: (nodeId: string, data: Partial<FlowNodeData>) => void;
  deleteNode: (nodeId: string) => void;
  selectNode: (nodeId: string | null) => void;
  deleteEdge: (edgeId: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  getSelectedNode: () => FlowNode | undefined;
  exportFlow: () => { nodes: FlowNode[]; edges: FlowEdge[] };
  importFlow: (data: { nodes: FlowNode[]; edges: FlowEdge[] }) => void;
}

const initialNodes: FlowNode[] = [
  {
    id: "start-1",
    type: "start",
    position: { x: 250, y: 50 },
    data: { label: "Start", trigger: "default" },
    deletable: false,
  },
];

function withHistory(
  state: FlowState,
  nextNodes: FlowNode[],
  nextEdges: FlowEdge[]
): Pick<FlowState, "nodes" | "edges" | "past" | "future" | "version"> {
  const currentSnapshot: FlowSnapshot = { nodes: state.nodes, edges: state.edges };
  const nextPast = [...state.past, currentSnapshot].slice(-HISTORY_LIMIT);
  return {
    nodes: nextNodes,
    edges: nextEdges,
    past: nextPast,
    future: [],
    version: state.version + 1,
  };
}

export const useFlowStore = create<FlowState>()(
  persist(
    (set, get) => ({
      nodes: initialNodes,
      edges: [],
      selectedNodeId: null,
      version: 0,
      past: [],
      future: [],

      onNodesChange: (changes) => {
        set((state) => {
          const nextNodes = applyNodeChanges(changes, state.nodes);

          const meaningful = changes.some((change) => {
            if (change.type === "select") return false;
            if (change.type === "dimensions") return false;
            if (change.type === "position") return !change.dragging;
            return true;
          });

          if (!meaningful) {
            return { nodes: nextNodes };
          }

          return withHistory(state, nextNodes, state.edges);
        });
      },

      onEdgesChange: (changes) => {
        set((state) => {
          const nextEdges = applyEdgeChanges(changes, state.edges);

          const meaningful = changes.some((change) => {
            if (change.type === "select") return false;
            return true;
          });

          if (!meaningful) {
            return { edges: nextEdges };
          }

          return withHistory(state, state.nodes, nextEdges);
        });
      },

      onConnect: (connection) => {
        const edge: FlowEdge = {
          ...connection,
          id: `e-${nanoid(8)}`,
          type: "smoothstep",
          animated: false,
        };
        set((state) => {
          const nextEdges = addEdge(edge, state.edges);
          return withHistory(state, state.nodes, nextEdges);
        });
      },

      addNode: (type, position) => {
        const id = `${type}-${nanoid(8)}`;
        const data = getDefaultData(type);
        const newNode: FlowNode = { id, type, position, data };
        set((state) => withHistory(state, [...state.nodes, newNode], state.edges));
        return id;
      },

      duplicateNode: (nodeId) => {
        const source = get().nodes.find((n) => n.id === nodeId);
        if (!source) return null;

        const id = `${source.type}-${nanoid(8)}`;
        const duplicate: FlowNode = {
          ...source,
          id,
          position: {
            x: source.position.x + 48,
            y: source.position.y + 48,
          },
          selected: false,
          dragging: false,
        };

        set((state) => withHistory(state, [...state.nodes, duplicate], state.edges));
        return id;
      },

      setNodePositions: (positions) => {
        set((state) => {
          const nextNodes = state.nodes.map((n) => {
            const nextPosition = positions[n.id];
            return nextPosition ? { ...n, position: nextPosition } : n;
          });
          return withHistory(state, nextNodes, state.edges);
        });
      },

      setNodeTransitionStyle: (transition) => {
        set((state) => ({
          nodes: state.nodes.map((n) => {
            const nextStyle = { ...(n.style ?? {}) } as CSSProperties;
            if (transition) {
              nextStyle.transition = transition;
            } else {
              delete nextStyle.transition;
            }
            return { ...n, style: nextStyle };
          }),
        }));
      },

      updateNodeData: (nodeId, data) => {
        set((state) => {
          const nextNodes = state.nodes.map((n) =>
            n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
          );
          return withHistory(state, nextNodes, state.edges);
        });
      },

      deleteNode: (nodeId) => {
        set((state) => {
          const nextNodes = state.nodes.filter((n) => n.id !== nodeId);
          const nextEdges = state.edges.filter(
            (e) => e.source !== nodeId && e.target !== nodeId
          );
          return {
            ...withHistory(state, nextNodes, nextEdges),
            selectedNodeId:
              state.selectedNodeId === nodeId ? null : state.selectedNodeId,
          };
        });
      },

      selectNode: (nodeId) => {
        set({ selectedNodeId: nodeId });
      },

      deleteEdge: (edgeId) => {
        set((state) => {
          const nextEdges = state.edges.filter((e) => e.id !== edgeId);
          return withHistory(state, state.nodes, nextEdges);
        });
      },

      undo: () => {
        set((state) => {
          if (state.past.length === 0) return state;
          const previous = state.past[state.past.length - 1];
          const nextPast = state.past.slice(0, -1);
          const currentSnapshot: FlowSnapshot = { nodes: state.nodes, edges: state.edges };
          return {
            nodes: previous.nodes,
            edges: previous.edges,
            selectedNodeId: null,
            version: state.version + 1,
            past: nextPast,
            future: [currentSnapshot, ...state.future].slice(0, HISTORY_LIMIT),
          };
        });
      },

      redo: () => {
        set((state) => {
          if (state.future.length === 0) return state;
          const [next, ...restFuture] = state.future;
          const currentSnapshot: FlowSnapshot = { nodes: state.nodes, edges: state.edges };
          return {
            nodes: next.nodes,
            edges: next.edges,
            selectedNodeId: null,
            version: state.version + 1,
            past: [...state.past, currentSnapshot].slice(-HISTORY_LIMIT),
            future: restFuture,
          };
        });
      },

      canUndo: () => {
        return get().past.length > 0;
      },

      canRedo: () => {
        return get().future.length > 0;
      },

      getSelectedNode: () => {
        const { nodes, selectedNodeId } = get();
        return nodes.find((n) => n.id === selectedNodeId);
      },

      exportFlow: () => {
        const { nodes, edges } = get();
        return { nodes, edges };
      },

      importFlow: (data) => {
        set((state) => ({
          ...withHistory(state, data.nodes, data.edges),
          selectedNodeId: null,
        }));
      },
    }),
    {
      name: "flow-storage", // unique name for localStorage
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
        version: state.version,
      }),
    }
  )
);
