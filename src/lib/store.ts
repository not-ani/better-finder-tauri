import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type { FileObject, SidebarItem, ViewMode, FinderState } from "./types";

interface FinderStore extends FinderState {
  editingPath: string | null;
  
  // Actions
  navigateTo: (path: string) => Promise<void>;
  goBack: () => Promise<void>;
  goForward: () => Promise<void>;
  refresh: () => Promise<void>;
  selectItem: (path: string, multiSelect?: boolean) => void;
  clearSelection: () => void;
  selectAll: () => void;
  setViewMode: (mode: ViewMode) => void;
  setSearchQuery: (query: string) => Promise<void>;
  setEditingPath: (path: string | null) => void;
  createFolder: () => Promise<void>;
  createFile: () => Promise<void>;
  renameItem: (oldPath: string, newName: string) => Promise<void>;
  deleteItem: (path: string) => Promise<void>;
  moveItem: (source: string, destination: string) => Promise<void>;
  copyItem: (source: string, destination: string) => Promise<void>;
  initialize: () => Promise<void>;
}

export const useFinderStore = create<FinderStore>((set, get) => ({
  currentPath: "",
  objects: [],
  selectedItems: new Set<string>(),
  viewMode: "icon",
  searchQuery: "",
  sidebarItems: [],
  history: [],
  historyIndex: -1,
  editingPath: null,

  initialize: async () => {
    const sidebarItems = await invoke<SidebarItem[]>("get_sidebar_items");
    const homeDir = sidebarItems.find((item) => item.name === "Home");
    set({ sidebarItems });
    if (homeDir) await get().navigateTo(homeDir.path);
  },

  navigateTo: async (path: string) => {
    const objects = await invoke<FileObject[]>("list_directory", { path, searchQuery: null });
    set((state) => {
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(path);
      return {
        currentPath: path,
        objects,
        selectedItems: new Set<string>(),
        searchQuery: "",
        history: newHistory,
        historyIndex: newHistory.length - 1,
        editingPath: null,
      };
    });
  },

  goBack: async () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const path = history[newIndex];
      const objects = await invoke<FileObject[]>("list_directory", { path, searchQuery: null });
      set({ currentPath: path, objects, selectedItems: new Set<string>(), historyIndex: newIndex, editingPath: null });
    }
  },

  goForward: async () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const path = history[newIndex];
      const objects = await invoke<FileObject[]>("list_directory", { path, searchQuery: null });
      set({ currentPath: path, objects, selectedItems: new Set<string>(), historyIndex: newIndex, editingPath: null });
    }
  },

  refresh: async () => {
    const { currentPath, searchQuery } = get();
    const objects = await invoke<FileObject[]>("list_directory", { path: currentPath, searchQuery: searchQuery || null });
    set({ objects });
  },

  selectItem: (path, multiSelect = false) => {
    set((state) => {
      const newSelection = new Set(multiSelect ? state.selectedItems : []);
      if (newSelection.has(path)) newSelection.delete(path);
      else newSelection.add(path);
      return { selectedItems: newSelection };
    });
  },

  clearSelection: () => set({ selectedItems: new Set<string>(), editingPath: null }),
  
  selectAll: () => set((state) => ({ selectedItems: new Set(state.objects.map((obj) => obj.path)) })),
  
  setViewMode: (mode) => set({ viewMode: mode }),
  
  setSearchQuery: async (query) => {
    const { currentPath } = get();
    const objects = await invoke<FileObject[]>("list_directory", { path: currentPath, searchQuery: query || null });
    set({ searchQuery: query, objects });
  },

  setEditingPath: (path) => set({ editingPath: path }),

  createFolder: async () => {
    const { currentPath } = get();
    const name = "untitled folder";
    const fullPath = await invoke<string>("create_folder", { path: currentPath, name });
    await get().refresh();
    set({ editingPath: fullPath, selectedItems: new Set([fullPath]) });
  },

  createFile: async () => {
    const { currentPath } = get();
    const name = "untitled file";
    const fullPath = await invoke<string>("create_file", { path: currentPath, name });
    await get().refresh();
    set({ editingPath: fullPath, selectedItems: new Set([fullPath]) });
  },

  renameItem: async (oldPath, newName) => {
    const newPath = await invoke<string>("rename_item", { oldPath, newName });
    await get().refresh();
    set({ editingPath: null, selectedItems: new Set([newPath]) });
  },

  deleteItem: async (path) => {
    await invoke("delete_item", { path });
    await get().refresh();
    set({ editingPath: null });
  },

  moveItem: async (source, destination) => {
    await invoke("move_item", { source, destination });
    await get().refresh();
  },

  copyItem: async (source, destination) => {
    await invoke("copy_item", { source, destination });
    await get().refresh();
  },
}));
