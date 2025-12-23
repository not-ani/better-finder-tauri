import { useRef, useCallback, useMemo, useState, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useFinderStore } from "@/lib/store";
import { FileItem } from "./FileItem";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Folder, File } from "lucide-react";

const GRID_ITEM_WIDTH = 120;
const GRID_ITEM_HEIGHT = 110;
const GRID_GAP = 16;
const GRID_PADDING = 16;
const OVERSCAN = 2; // rows to render outside visible area

export function FileGrid() {
  const objects = useFinderStore((state) => state.objects);
  const createFolder = useFinderStore((state) => state.createFolder);
  const createFile = useFinderStore((state) => state.createFile);
  
  const parentRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Update container width on mount and resize
  useEffect(() => {
    const updateWidth = () => {
      if (parentRef.current) {
        setContainerWidth(parentRef.current.clientWidth);
      }
    };
    
    updateWidth();
    
    const resizeObserver = new ResizeObserver(updateWidth);
    if (parentRef.current) {
      resizeObserver.observe(parentRef.current);
    }
    
    return () => resizeObserver.disconnect();
  }, []);

  // Calculate columns based on container width
  const columnCount = useMemo(() => {
    const availableWidth = containerWidth - (GRID_PADDING * 2);
    return Math.max(1, Math.floor((availableWidth + GRID_GAP) / (GRID_ITEM_WIDTH + GRID_GAP)));
  }, [containerWidth]);

  // Memoize row calculation
  const rows = useMemo(() => {
    const rowCount = Math.ceil(objects.length / columnCount);
    const rowsArray: typeof objects[] = [];
    
    for (let i = 0; i < rowCount; i++) {
      rowsArray.push(objects.slice(i * columnCount, (i + 1) * columnCount));
    }
    
    return rowsArray;
  }, [objects, columnCount]);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => GRID_ITEM_HEIGHT + GRID_GAP, []),
    overscan: OVERSCAN,
  });

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div 
          ref={parentRef} 
          className="h-full overflow-auto"
          style={{ padding: GRID_PADDING }}
        >
          {objects.length === 0 ? (
            <div className="col-span-full py-12 text-center text-muted-foreground">
              This folder is empty
            </div>
          ) : (
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: "100%",
                position: "relative",
              }}
            >
              {virtualItems.map((virtualRow) => {
                const rowItems = rows[virtualRow.index];
                return (
                  <div
                    key={virtualRow.key}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                      display: "grid",
                      gridTemplateColumns: `repeat(${columnCount}, ${GRID_ITEM_WIDTH}px)`,
                      gap: GRID_GAP,
                    }}
                  >
                    {rowItems.map((item) => (
                      <FileItem key={item.path} item={item} viewMode="icon" />
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onSelect={() => createFolder()}>
          <Folder />
          New Folder
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => createFile()}>
          <File />
          New File
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
