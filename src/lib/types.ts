export type ObjectType = "File" | "Folder";

export interface FileObject {
  path: string;
  name: string;
  object_type: ObjectType;
  relevance: number;
  size?: number;
  modified?: string;
}

export interface SidebarItem {
  name: string;
  path: string;
}

export type ViewMode = "icon" | "list" | "column";

export interface FinderState {
  currentPath: string;
  objects: FileObject[];
  selectedItems: Set<string>;
  viewMode: ViewMode;
  searchQuery: string;
  sidebarItems: SidebarItem[];
  history: string[];
  historyIndex: number;
}

