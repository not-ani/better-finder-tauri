import { memo, useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFinderStore } from "@/lib/store";
import {
  ChevronLeft,
  ChevronRight,
  Grid3x3,
  List,
  Columns3,
  Search,
} from "lucide-react";

const SEARCH_DEBOUNCE_MS = 300;

export const FinderToolbar = memo(function FinderToolbar() {
  // Use individual selectors for granular updates
  const viewMode = useFinderStore((state) => state.viewMode);
  const setViewMode = useFinderStore((state) => state.setViewMode);
  const searchQuery = useFinderStore((state) => state.searchQuery);
  const setSearchQuery = useFinderStore((state) => state.setSearchQuery);
  const goBack = useFinderStore((state) => state.goBack);
  const goForward = useFinderStore((state) => state.goForward);
  const historyIndex = useFinderStore((state) => state.historyIndex);
  const historyLength = useFinderStore((state) => state.history.length);

  const [localSearch, setLocalSearch] = useState(searchQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Sync local search with store when store changes (e.g., navigation)
  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < historyLength - 1;

  // Debounced search handler
  const handleSearch = useCallback((value: string) => {
    setLocalSearch(value);
    
    // Clear any pending debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    // Debounce the actual search
    debounceRef.current = setTimeout(() => {
      setSearchQuery(value);
    }, SEARCH_DEBOUNCE_MS);
  }, [setSearchQuery]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Memoized view mode handlers
  const handleSetIconView = useCallback(() => setViewMode("icon"), [setViewMode]);
  const handleSetListView = useCallback(() => setViewMode("list"), [setViewMode]);
  const handleSetColumnView = useCallback(() => setViewMode("column"), [setViewMode]);

  return (
    <div className="flex items-center gap-2 border-b bg-background px-4 py-2">
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={goBack}
          disabled={!canGoBack}
          className="size-8"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={goForward}
          disabled={!canGoForward}
          className="size-8"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <div className="relative flex-1">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search..."
          value={localSearch}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="flex items-center gap-1 border-l pl-2">
        <Button
          variant={viewMode === "icon" ? "secondary" : "ghost"}
          size="icon"
          onClick={handleSetIconView}
          className="size-8"
        >
          <Grid3x3 className="size-4" />
        </Button>
        <Button
          variant={viewMode === "list" ? "secondary" : "ghost"}
          size="icon"
          onClick={handleSetListView}
          className="size-8"
        >
          <List className="size-4" />
        </Button>
        <Button
          variant={viewMode === "column" ? "secondary" : "ghost"}
          size="icon"
          onClick={handleSetColumnView}
          className="size-8"
        >
          <Columns3 className="size-4" />
        </Button>
      </div>
    </div>
  );
});
