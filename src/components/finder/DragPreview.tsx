import { FileObject } from "@/lib/types";
import { Folder, File } from "lucide-react";

interface DragPreviewProps {
  items: FileObject[];
}

export function DragPreview({ items }: DragPreviewProps) {
  if (items.length === 0) return null;

  const firstItem = items[0];
  const Icon = firstItem.object_type === "Folder" ? Folder : File;

  return (
    <div className="pointer-events-none fixed opacity-80">
      <div className="flex items-center gap-2 rounded-lg border bg-background p-2 shadow-lg">
        <Icon className="size-6 text-muted-foreground" />
        <span className="text-sm font-medium">
          {items.length === 1 ? firstItem.name : `${items.length} items`}
        </span>
      </div>
    </div>
  );
}

