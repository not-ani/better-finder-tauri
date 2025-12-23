import { useRef, useEffect, useState, useCallback, memo } from "react";
import { FileObject } from "@/lib/types";
import { useFinderStore } from "@/lib/store";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  File,
  Folder,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileCode,
  FileArchive,
  Pencil,
  Copy,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FileItemProps {
  item: FileObject;
  viewMode: "icon" | "list" | "column";
  style?: React.CSSProperties;
}

export const getFileIcon = (name: string, isFolder: boolean) => {
  if (isFolder) return Folder;
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(ext)) return FileImage;
  if (["mp4", "mov", "avi", "mkv"].includes(ext)) return FileVideo;
  if (["mp3", "wav", "flac", "m4a"].includes(ext)) return FileAudio;
  if (["js", "ts", "tsx", "jsx", "py", "rs", "go", "java"].includes(ext)) return FileCode;
  if (["zip", "tar", "gz", "rar", "7z"].includes(ext)) return FileArchive;
  if (["txt", "md", "json", "xml", "yaml"].includes(ext)) return FileText;
  return File;
};

const formatSize = (bytes?: number) => {
  if (!bytes) return "";
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

const formatDate = (timestamp?: string) => {
  if (!timestamp) return "";
  return new Date(parseInt(timestamp) * 1000).toLocaleDateString();
};

export const FileItem = memo(function FileItem({ item, viewMode, style }: FileItemProps) {
  // Use individual selectors for better performance
  const selectedItems = useFinderStore((state) => state.selectedItems);
  const selectItem = useFinderStore((state) => state.selectItem);
  const navigateTo = useFinderStore((state) => state.navigateTo);
  const editingPath = useFinderStore((state) => state.editingPath);
  const setEditingPath = useFinderStore((state) => state.setEditingPath);
  const renameItem = useFinderStore((state) => state.renameItem);
  const deleteItem = useFinderStore((state) => state.deleteItem);
  const copyItem = useFinderStore((state) => state.copyItem);
  const currentPath = useFinderStore((state) => state.currentPath);
  const isSelected = selectedItems.has(item.path);
  const isFolder = item.object_type === "Folder";
  const isEditing = editingPath === item.path;
  const Icon = getFileIcon(item.name, isFolder);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const [editValue, setEditValue] = useState(item.name);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(item.name);
  }, [item.name]);

  const handleSave = useCallback(async () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== item.name) {
      await renameItem(item.path, trimmed);
    } else {
      setEditingPath(null);
    }
  }, [editValue, item.path, item.name, renameItem, setEditingPath]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === "Enter") handleSave();
    else if (e.key === "Escape") {
      setEditValue(item.name);
      setEditingPath(null);
    }
  };

  const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({
    id: item.path,
    data: { item, selectedPaths: selectedItems.has(item.path) ? Array.from(selectedItems) : [item.path] },
    disabled: isEditing,
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `drop-${item.path}`,
    data: { item },
    disabled: !isFolder || isEditing,
  });

  const setNodeRef = (node: HTMLDivElement | null) => {
    setDragRef(node);
    if (isFolder) setDropRef(node);
  };

  const dragStyle = transform ? { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.5 : 1 } : {};

  const handleClick = (e: React.MouseEvent) => {
    if (isEditing) return;
    if (e.metaKey || e.ctrlKey) selectItem(item.path, true);
    else selectItem(item.path, false);
  };

  const handleDoubleClick = () => {
    if (isEditing) return;
    if (isFolder) navigateTo(item.path);
  };

  const NameDisplay = isEditing ? (
    <input
      ref={inputRef}
      value={editValue}
      onChange={(e) => setEditValue(e.target.value)}
      onBlur={handleSave}
      onKeyDown={handleKeyDown}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "bg-background text-foreground border border-primary rounded px-1 text-sm outline-none",
        viewMode === "icon" ? "w-[100px] text-center" : "flex-1"
      )}
    />
  ) : (
    <span className={cn("truncate text-sm", viewMode === "icon" && "max-w-[100px] text-center")}>
      {item.name}
    </span>
  );

  const itemContent = (
    <div
      ref={setNodeRef}
      style={{ ...style, ...dragStyle }}
      className={cn(
        viewMode === "icon" && "flex cursor-pointer flex-col items-center gap-2 rounded-lg p-3 transition-colors hover:bg-accent select-none touch-none",
        viewMode === "list" && "grid cursor-pointer grid-cols-[1fr_100px_100px] items-center gap-4 rounded px-3 py-2 transition-colors hover:bg-accent select-none touch-none",
        viewMode === "column" && "flex cursor-pointer items-center gap-2 rounded px-3 py-2 text-sm transition-colors hover:bg-accent select-none touch-none",
        isSelected && "bg-primary/20 ring-2 ring-primary/50",
        isOver && isFolder && "bg-primary/30 ring-2 ring-primary",
        isDragging && "z-50"
      )}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      {...(isEditing ? {} : { ...listeners, ...attributes })}
    >
      {viewMode === "icon" && (
        <>
          <Icon className="size-12 text-muted-foreground pointer-events-none" />
          {NameDisplay}
        </>
      )}
      {viewMode === "list" && (
        <>
          <div className="flex items-center gap-2">
            <Icon className="size-4 text-muted-foreground" />
            {NameDisplay}
          </div>
          <span className="text-sm text-muted-foreground">{formatDate(item.modified)}</span>
          <span className="text-sm text-muted-foreground">{isFolder ? "--" : formatSize(item.size)}</span>
        </>
      )}
      {viewMode === "column" && (
        <>
          <Icon className="size-4 text-muted-foreground" />
          {NameDisplay}
        </>
      )}
    </div>
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild disabled={isEditing}>
        {itemContent}
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onSelect={() => setEditingPath(item.path)}>
          <Pencil />
          Rename
        </ContextMenuItem>
        <ContextMenuItem onSelect={() => copyItem(item.path, currentPath)}>
          <Copy />
          Duplicate
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive" onSelect={() => deleteItem(item.path)}>
          <Trash2 />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
});
