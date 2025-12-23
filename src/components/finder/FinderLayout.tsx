import { useEffect, useState, useCallback, useMemo, memo } from "react";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
} from "@dnd-kit/core";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { FinderSidebar } from "./FinderSidebar";
import { FinderToolbar } from "./FinderToolbar";
import { FileGrid } from "./FileGrid";
import { FileList } from "./FileList";
import { FileColumns } from "./FileColumns";
import { DragOverlay } from "./DragOverlay";
import { useFinderStore } from "@/lib/store";
import { FileObject } from "@/lib/types";

// Memoized content component to prevent re-renders when only drag state changes
const FileContent = memo(function FileContent({ viewMode }: { viewMode: string }) {
  return (
    <div className="flex-1 overflow-auto">
      {viewMode === "icon" && <FileGrid />}
      {viewMode === "list" && <FileList />}
      {viewMode === "column" && <FileColumns />}
    </div>
  );
});

export function FinderLayout() {
  // Use individual selectors for granular updates
  const viewMode = useFinderStore((state) => state.viewMode);
  const initialize = useFinderStore((state) => state.initialize);
  const clearSelection = useFinderStore((state) => state.clearSelection);
  const objects = useFinderStore((state) => state.objects);
  const navigateTo = useFinderStore((state) => state.navigateTo);
  const moveItem = useFinderStore((state) => state.moveItem);
  const setEditingPath = useFinderStore((state) => state.setEditingPath);
  
  const [activeItem, setActiveItem] = useState<FileObject | null>(null);
  const [draggedPaths, setDraggedPaths] = useState<string[]>([]);

  // Memoize sensor configuration
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Memoize keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const { editingPath, selectedItems, objects } = useFinderStore.getState();
      
      if (editingPath) {
        if (e.key === "Escape") setEditingPath(null);
        return;
      }

      if (e.key === "Escape") clearSelection();

      if ((e.metaKey || e.ctrlKey) && e.key === "a") {
        e.preventDefault();
        useFinderStore.getState().selectAll();
      }

      if ((e.key === "Delete" || e.key === "Backspace") && selectedItems.size > 0) {
        const selected = Array.from(selectedItems);
        Promise.all(selected.map((path) => useFinderStore.getState().deleteItem(path)));
      }

      if (objects.length > 0 && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        const selected = Array.from(selectedItems);
        const currentIndex = selected.length > 0 ? objects.findIndex(obj => obj.path === selected[0]) : -1;
        let newIndex = currentIndex;

        if (e.key === "ArrowDown" || e.key === "ArrowRight") {
          newIndex = currentIndex < objects.length - 1 ? currentIndex + 1 : currentIndex;
        } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
          newIndex = currentIndex > 0 ? currentIndex - 1 : 0;
        }

        if (newIndex >= 0 && newIndex < objects.length) {
          useFinderStore.getState().selectItem(objects[newIndex].path, false);
        }
      }

      if (e.key === "Enter") {
        const selected = Array.from(selectedItems);
        if (selected.length === 1) {
          const item = objects.find(obj => obj.path === selected[0]);
          if (item?.object_type === "Folder") navigateTo(item.path);
          else if (item) setEditingPath(item.path);
        }
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        useFinderStore.getState().createFolder();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [clearSelection, navigateTo, setEditingPath]);

  // Memoize drag handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const item = objects.find(obj => obj.path === event.active.id);
    if (item) {
      setActiveItem(item);
      setDraggedPaths(event.active.data.current?.selectedPaths || [item.path]);
    }
  }, [objects]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    setActiveItem(null);
    setDraggedPaths([]);

    const { over, active } = event;
    if (!over) return;

    const dropTargetId = over.id.toString();
    if (!dropTargetId.startsWith("drop-")) return;

    const targetPath = dropTargetId.replace("drop-", "");
    const targetItem = objects.find(obj => obj.path === targetPath);
    if (!targetItem || targetItem.object_type !== "Folder") return;

    const paths = active.data.current?.selectedPaths || [active.id.toString()];
    for (const sourcePath of paths) {
      if (sourcePath !== targetPath && !targetPath.startsWith(sourcePath + "/")) {
        await moveItem(sourcePath, targetPath);
      }
    }
  }, [objects, moveItem]);

  // Memoize draggedCount
  const draggedCount = useMemo(() => draggedPaths.length, [draggedPaths.length]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SidebarProvider>
        <div className="flex h-screen w-full">
          <FinderSidebar />
          <SidebarInset className="flex flex-col">
            <FinderToolbar />
            <FileContent viewMode={viewMode} />
          </SidebarInset>
        </div>
      </SidebarProvider>
      <DragOverlay activeItem={activeItem} draggedCount={draggedCount} />
    </DndContext>
  );
}
