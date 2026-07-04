"use client";

import { useFlowStore } from "@/store/flowStore";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from "@/components/ui/context-menu";

export function NodeContextMenu({
  nodeId,
  nodeType,
  children,
}: {
  nodeId: string;
  nodeType: string;
  children: React.ReactNode;
}) {
  const selectNode = useFlowStore((s) => s.selectNode);
  const duplicateNode = useFlowStore((s) => s.duplicateNode);
  const deleteNode = useFlowStore((s) => s.deleteNode);

  const canDelete = nodeType !== "start";
  const canDuplicate = nodeType !== "start";

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem
          onClick={() => {
            selectNode(nodeId);
          }}
        >
          Edit Node
        </ContextMenuItem>
        <ContextMenuItem
          disabled={!canDuplicate}
          onClick={() => {
            const duplicatedId = duplicateNode(nodeId);
            if (duplicatedId) selectNode(duplicatedId);
          }}
        >
          Duplicate
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          disabled={!canDelete}
          onClick={() => {
            if (!canDelete) return;
            deleteNode(nodeId);
          }}
          className="text-red focus:text-red"
        >
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

