import type { FlowEdge, FlowNode } from "@/types/flow";

export interface FlowLayoutOptions {
  baseX?: number;
  baseY?: number;
  colGap?: number;
  rowGap?: number;
}

export type FlowPositionMap = Record<string, { x: number; y: number }>;

const DEFAULT_LAYOUT: Required<FlowLayoutOptions> = {
  baseX: 120,
  baseY: 80,
  colGap: 360,
  rowGap: 180,
};

function buildGraph(nodes: FlowNode[], edges: FlowEdge[]) {
  const orderedByX = [...nodes].sort((a, b) => a.position.x - b.position.x);
  const indegree = new Map<string, number>();
  const outgoing = new Map<string, string[]>();
  const layer = new Map<string, number>();

  for (const node of orderedByX) {
    indegree.set(node.id, 0);
    outgoing.set(node.id, []);
    layer.set(node.id, 0);
  }

  for (const edge of edges) {
    if (!indegree.has(edge.target) || !outgoing.has(edge.source)) continue;
    indegree.set(edge.target, (indegree.get(edge.target) ?? 0) + 1);
    outgoing.get(edge.source)?.push(edge.target);
  }

  return { orderedByX, indegree, outgoing, layer };
}

function assignLayers({
  orderedByX,
  indegree,
  outgoing,
  layer,
}: ReturnType<typeof buildGraph>) {
  const queue: string[] = orderedByX
    .filter((node) => (indegree.get(node.id) ?? 0) === 0)
    .map((node) => node.id);
  const visited = new Set<string>();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;
    visited.add(current);

    for (const target of outgoing.get(current) ?? []) {
      const nextLayer = Math.max(layer.get(target) ?? 0, (layer.get(current) ?? 0) + 1);
      layer.set(target, nextLayer);

      const nextIndegree = (indegree.get(target) ?? 0) - 1;
      indegree.set(target, nextIndegree);
      if (nextIndegree === 0) queue.push(target);
    }
  }

  const maxAssignedLayer = layer.size > 0 ? Math.max(...layer.values()) : 0;
  let cycleLayer = maxAssignedLayer + 1;
  for (const node of orderedByX) {
    if (visited.has(node.id)) continue;
    layer.set(node.id, cycleLayer++);
  }

  return layer;
}

function buildPositionMap(
  nodes: FlowNode[],
  layer: Map<string, number>,
  options: Required<FlowLayoutOptions>
): FlowPositionMap {
  const byLayer = new Map<number, FlowNode[]>();
  for (const node of nodes) {
    const column = layer.get(node.id) ?? 0;
    const nodesInColumn = byLayer.get(column) ?? [];
    nodesInColumn.push(node);
    byLayer.set(column, nodesInColumn);
  }

  const positionMap: FlowPositionMap = {};
  const orderedColumns = [...byLayer.keys()].sort((a, b) => a - b);

  for (const column of orderedColumns) {
    const nodesInColumn = (byLayer.get(column) ?? []).sort((a, b) => a.position.y - b.position.y);
    nodesInColumn.forEach((node, row) => {
      positionMap[node.id] = {
        x: options.baseX + column * options.colGap,
        y: options.baseY + row * options.rowGap,
      };
    });
  }

  return positionMap;
}

export function createAutoLayoutPositions(
  nodes: FlowNode[],
  edges: FlowEdge[],
  options: FlowLayoutOptions = {}
): FlowPositionMap {
  if (nodes.length === 0) return {};

  const resolvedOptions = { ...DEFAULT_LAYOUT, ...options };
  const graph = buildGraph(nodes, edges);
  const layer = assignLayers(graph);
  return buildPositionMap(nodes, layer, resolvedOptions);
}
