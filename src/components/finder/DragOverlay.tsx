import { memo } from "react";
import { DragOverlay as DndKitDragOverlay } from "@dnd-kit/core";
import { FileObject } from "@/lib/types";
import { getFileIcon } from "./FileItem";
import { cn } from "@/lib/utils";

interface DragOverlayProps {
  activeItem: FileObject | null;
  draggedCount: number;
}

export const DragOverlay = memo(function DragOverlay({ activeItem, draggedCount }: DragOverlayProps) {
  if (!activeItem) return null;

  const isFolder = activeItem.object_type === "Folder";
  const Icon = getFileIcon(activeItem.name, isFolder);

  return (
    <DndKitDragOverlay dropAnimation={null}>
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg bg-background/95 px-3 py-2 shadow-lg ring-2 ring-primary",
          "backdrop-blur-sm"
        )}
      >
        <Icon className="size-5 text-muted-foreground" />
        <span className="text-sm font-medium">
          {draggedCount > 1 ? `${draggedCount} items` : activeItem.name}
        </span>
        {draggedCount > 1 && (
          <span className="flex size-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {draggedCount}
          </span>
        )}
      </div>
    </DndKitDragOverlay>
  );
});

