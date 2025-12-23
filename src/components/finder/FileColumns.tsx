import { useRef, useState, useEffect, useCallback, useMemo } from "react";
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

const COLUMN_ITEM_HEIGHT = 36;
const OVERSCAN = 5;

function VirtualizedColumn({ items, isEmpty }: { items: typeof useFinderStore.getState extends () => { objects: infer T } ? T : never; isEmpty?: boolean }) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => COLUMN_ITEM_HEIGHT, []),
    overscan: OVERSCAN,
  });

  const virtualItems = virtualizer.getVirtualItems();

  if (isEmpty && items.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground text-center">
        Empty
      </div>
    );
  }

  return (
    <div ref={parentRef} className="flex-1 overflow-y-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualItems.map((virtualItem) => {
          const item = items[virtualItem.index];
          return (
            <div
              key={virtualItem.key}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <FileItem item={item} viewMode="column" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function FileColumns() {
  const objects = useFinderStore((state) => state.objects);
  const currentPath = useFinderStore((state) => state.currentPath);
  const createFolder = useFinderStore((state) => state.createFolder);
  const createFile = useFinderStore((state) => state.createFile);
  
  const [columns, setColumns] = useState<string[]>([currentPath]);

  // Memoize path parsing
  const parsedColumns = useMemo(() => {
    const parts = currentPath.split("/").filter(Boolean);
    const paths: string[] = [];
    
    for (let i = 0; i < parts.length; i++) {
      paths.push("/" + parts.slice(0, i + 1).join("/"));
    }
    
    if (paths.length === 0) paths.push("/");
    return paths;
  }, [currentPath]);

  useEffect(() => {
    setColumns(parsedColumns);
  }, [parsedColumns]);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="flex h-full overflow-x-auto">
          {columns.map((path, index) => (
            <div
              key={path}
              className="min-w-[250px] shrink-0 border-r flex flex-col"
              style={{ width: "250px" }}
            >
              {index === columns.length - 1 ? (
                <VirtualizedColumn items={objects} isEmpty />
              ) : (
                <div className="p-4 text-sm text-muted-foreground">
                  {path.split("/").pop() || "/"}
                </div>
              )}
            </div>
          ))}
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
