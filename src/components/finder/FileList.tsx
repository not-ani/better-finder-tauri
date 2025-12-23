import { useRef, useCallback } from "react";
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

const LIST_ITEM_HEIGHT = 36; // Fixed height for list items
const OVERSCAN = 5; // Number of items to render outside the visible area

export function FileList() {
  const objects = useFinderStore((state) => state.objects);
  const createFolder = useFinderStore((state) => state.createFolder);
  const createFile = useFinderStore((state) => state.createFile);
  
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: objects.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => LIST_ITEM_HEIGHT, []),
    overscan: OVERSCAN,
  });

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div 
          ref={parentRef} 
          className="flex flex-col p-2 h-full overflow-auto"
        >
          {/* Header - always visible */}
          <div className="grid grid-cols-[1fr_100px_100px] gap-4 px-3 py-2 text-xs font-medium text-muted-foreground border-b sticky top-0 bg-background z-10">
            <span>Name</span>
            <span>Modified</span>
            <span>Size</span>
          </div>
          
          {objects.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
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
              {virtualItems.map((virtualItem) => {
                const item = objects[virtualItem.index];
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
                    <FileItem item={item} viewMode="list" />
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
