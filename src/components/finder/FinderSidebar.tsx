import { memo, useMemo, useCallback } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { useFinderStore } from "@/lib/store";
import type { SidebarItem } from "@/lib/types";
import {
  Home,
  FolderOpen,
  Download,
  FileText,
  Folder,
  Music,
  Image,
  Film,
  Cloud,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Home,
  Desktop: FolderOpen,
  Documents: FileText,
  Downloads: Download,
  Applications: Folder,
  Music,
  Pictures: Image,
  Movies: Film,
  Dropbox: Cloud,
  "iCloud Drive": Cloud,
};

// Memoized sidebar item component
const SidebarItemComponent = memo(function SidebarItemComponent({
  item,
  isActive,
  onNavigate,
}: {
  item: SidebarItem;
  isActive: boolean;
  onNavigate: (path: string) => void;
}) {
  const Icon = iconMap[item.name] || Folder;
  const handleClick = useCallback(() => onNavigate(item.path), [onNavigate, item.path]);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton isActive={isActive} onClick={handleClick}>
        <Icon className="size-4" />
        <span>{item.name}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
});

// Memoized group component
const SidebarGroupComponent = memo(function SidebarGroupComponent({
  title,
  items,
  currentPath,
  onNavigate,
}: {
  title: string;
  items: SidebarItem[];
  currentPath: string;
  onNavigate: (path: string) => void;
}) {
  if (items.length === 0) return null;

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{title}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarItemComponent
              key={item.path}
              item={item}
              isActive={currentPath === item.path}
              onNavigate={onNavigate}
            />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
});

export const FinderSidebar = memo(function FinderSidebar() {
  // Use individual selectors
  const sidebarItems = useFinderStore((state) => state.sidebarItems);
  const currentPath = useFinderStore((state) => state.currentPath);
  const navigateTo = useFinderStore((state) => state.navigateTo);

  // Memoize filtered groups
  const { favorites, cloud, locations } = useMemo(() => ({
    favorites: sidebarItems.filter((item) =>
      ["Home", "Desktop", "Documents", "Downloads"].includes(item.name)
    ),
    cloud: sidebarItems.filter((item) =>
      ["iCloud Drive", "Dropbox"].includes(item.name)
    ),
    locations: sidebarItems.filter(
      (item) =>
        !["Home", "Desktop", "Documents", "Downloads", "iCloud Drive", "Dropbox"].includes(
          item.name
        )
    ),
  }), [sidebarItems]);

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroupComponent
          title="Favorites"
          items={favorites}
          currentPath={currentPath}
          onNavigate={navigateTo}
        />
        <SidebarGroupComponent
          title="iCloud"
          items={cloud}
          currentPath={currentPath}
          onNavigate={navigateTo}
        />
        <SidebarGroupComponent
          title="Locations"
          items={locations}
          currentPath={currentPath}
          onNavigate={navigateTo}
        />
      </SidebarContent>
    </Sidebar>
  );
});
