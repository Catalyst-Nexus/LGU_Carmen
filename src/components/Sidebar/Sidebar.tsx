import { useCallback, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import { useSettingsStore } from "@/store";
import { useRBAC } from "@/hooks/useRBAC";
import { getIconByName } from "@/lib/iconMap";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  User,
  ChevronLeft,
  ChevronRight,
  LucideIcon,
  GripVertical,
  Edit3,
  RotateCcw,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import type { SensorDescriptor, SensorOptions } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/* ── Sidebar Tooltip ──────────────────────────────────────────────── */
const SidebarTooltip = ({
  text,
  children,
}: {
  text?: string;
  children: React.ReactNode;
}) => {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const ref = useRef<HTMLDivElement>(null);

  const show = useCallback(() => {
    if (!text || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPos({ top: rect.top + rect.height / 2, left: rect.right + 8 });
    setVisible(true);
  }, [text]);

  const hide = useCallback(() => setVisible(false), []);

  return (
    <div ref={ref} onMouseEnter={show} onMouseLeave={hide}>
      {children}
      {text && visible && (
        <div
          className="fixed z-[9999] px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-md shadow-lg whitespace-nowrap pointer-events-none"
          style={{
            top: pos.top,
            left: pos.left,
            transform: "translateY(-50%)",
          }}
        >
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-gray-900" />
          {text}
        </div>
      )}
    </div>
  );
};

interface MenuItem {
  to: string;
  icon: LucideIcon;
  label: string;
  id: string; // unique identifier for drag-and-drop
  tooltip?: string; // optional hover tooltip text
}

interface MenuSection {
  title: string;
  items: MenuItem[];
  id: string; // unique identifier for section drag-and-drop
}

// Sortable section component
interface SortableSectionProps {
  section: MenuSection;
  sidebarCollapsed: boolean;
  compactMode: boolean;
  isEditMode: boolean;
  location: ReturnType<typeof useLocation>;
  sensors: SensorDescriptor<SensorOptions>[];
  onItemDragEnd: (event: DragEndEvent, sectionTitle: string) => void;
}

const SortableSection = ({
  section,
  sidebarCollapsed,
  compactMode,
  isEditMode,
  location,
  sensors,
  onItemDragEnd,
}: SortableSectionProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="mb-2">
      {!sidebarCollapsed && (
        <div
          className={cn(
            "px-3 text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-2",
            compactMode ? "py-3" : "py-5",
          )}
        >
          {isEditMode && (
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing text-muted hover:text-foreground"
              aria-label="Drag to reorder section"
            >
              <GripVertical className="w-3.5 h-3.5" />
            </button>
          )}
          <span>{section.title}</span>
        </div>
      )}
      {isEditMode && !sidebarCollapsed ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={(event) => onItemDragEnd(event, section.title)}
        >
          <SortableContext
            items={section.items.map((item) => item.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = location.pathname === item.to;
                return (
                  <SortableMenuItem
                    key={item.id}
                    item={item}
                    isActive={isActive}
                    sidebarCollapsed={sidebarCollapsed}
                    compactMode={compactMode}
                    isEditMode={isEditMode}
                  />
                );
              })}
            </ul>
          </SortableContext>
        </DndContext>
      ) : (
        <ul className="space-y-0.5">
          {section.items.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;

            return (
              <li key={item.id}>
                <SidebarTooltip text={item.tooltip}>
                  <Link
                    to={item.to}
                    className={cn(
                      "flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200",
                      compactMode ? "px-3 py-2" : "px-4 py-3",
                      sidebarCollapsed && "justify-center px-2",
                      isActive
                        ? "bg-success text-white"
                        : "text-foreground hover:bg-background",
                    )}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </Link>
                </SidebarTooltip>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

// Sortable menu item component
interface SortableMenuItemProps {
  item: MenuItem;
  isActive: boolean;
  sidebarCollapsed: boolean;
  compactMode: boolean;
  isEditMode: boolean;
}

const SortableMenuItem = ({
  item,
  isActive,
  sidebarCollapsed,
  compactMode,
  isEditMode,
}: SortableMenuItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon = item.icon;

  return (
    <li ref={setNodeRef} style={style}>
      <SidebarTooltip text={item.tooltip}>
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg text-sm font-medium transition-all duration-200",
            compactMode ? "px-3 py-2" : "px-4 py-3",
            sidebarCollapsed && !isEditMode && "justify-center px-2",
            isActive
              ? "bg-success text-white"
              : "text-foreground hover:bg-background",
          )}
        >
          {isEditMode && !sidebarCollapsed && (
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing text-muted hover:text-foreground"
              aria-label="Drag to reorder"
            >
              <GripVertical className="w-4 h-4" />
            </button>
          )}
          <Link
            to={item.to}
            className={cn(
              "flex items-center gap-3 flex-1",
              sidebarCollapsed && !isEditMode && "justify-center",
            )}
          >
            <Icon className="w-5 h-5 shrink-0" />
            {!sidebarCollapsed && <span>{item.label}</span>}
          </Link>
        </div>
      </SidebarTooltip>
    </li>
  );
};

const Sidebar = () => {
  const location = useLocation();
  const sidebarCollapsed = useSettingsStore((state) => state.sidebarCollapsed);
  const setSidebarCollapsed = useSettingsStore(
    (state) => state.setSidebarCollapsed,
  );
  const compactMode = useSettingsStore((state) => state.compactMode);
  const systemLogo = useSettingsStore((state) => state.systemLogo);
  const sidebarOrder = useSettingsStore((state) => state.sidebarOrder);
  const setSidebarOrder = useSettingsStore((state) => state.setSidebarOrder);
  const sidebarSectionOrder = useSettingsStore(
    (state) => state.sidebarSectionOrder,
  );
  const setSidebarSectionOrder = useSettingsStore(
    (state) => state.setSidebarSectionOrder,
  );
  const resetSidebarOrder = useSettingsStore(
    (state) => state.resetSidebarOrder,
  );

  const [isEditMode, setIsEditMode] = useState(false);

  // Get modules from RBAC context
  const { userModules } = useRBAC();

  // Configure drag-and-drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Static menu sections
  const staticSections: MenuSection[] = useMemo(
    () => [
      {
        title: "MAIN",
        id: "section-main",
        items: [
          {
            to: "/dashboard",
            icon: LayoutDashboard,
            label: "Dashboard",
            id: "main-dashboard",
          },
        ],
      },
      {
        title: "USER",
        id: "section-user",
        items: [
          {
            to: "/dashboard/profile",
            icon: User,
            label: "User Profile",
            id: "user-profile",
          },
        ],
      },
    ],
    [],
  );

  // Build dynamic sections from RBAC user modules grouped by category
  const dynamicSections: MenuSection[] = useMemo(() => {
    if (userModules.length === 0) return [];

    // Group modules by category
    const grouped = userModules.reduce(
      (acc, module) => {
        const category = module.category || "MODULES";
        if (!acc[category]) {
          acc[category] = [];
        }

        // Tooltip map for specific modules
        const tooltipMap: Record<string, string> = {
          "Estimate Income": "Volume 1 Section 8",
          "General Accounting Plan": "Volume 1 Section 5",
          "Classification Appropriation": "Volume 1 Section 11",
        };

        acc[category].push({
          to: `/dashboard${module.route_path}`,
          icon: getIconByName(module.icons),
          label: module.module_name,
          id: `module-${module.id}`,
          tooltip: tooltipMap[module.module_name],
        });
        return acc;
      },
      {} as Record<string, MenuItem[]>,
    );

    // Convert to MenuSection array
    return Object.entries(grouped).map(([title, items]) => ({
      title: title.toUpperCase(),
      id: `section-${title.toLowerCase()}`,
      items,
    }));
  }, [userModules]);

  // Combine static and dynamic sections
  const menuSections: MenuSection[] = useMemo(() => {
    const sections = [...staticSections, ...dynamicSections];

    // Apply custom item ordering within sections
    const sectionsWithOrderedItems = sections.map((section) => {
      const savedOrder = sidebarOrder[section.title];
      if (savedOrder && savedOrder.length > 0) {
        // Create a map for quick lookup
        const itemMap = new Map(section.items.map((item) => [item.id, item]));

        // Reorder items based on saved order
        const orderedItems = savedOrder
          .map((id) => itemMap.get(id))
          .filter((item): item is MenuItem => item !== undefined);

        // Add any new items that aren't in the saved order
        const orderedIds = new Set(savedOrder);
        const newItems = section.items.filter(
          (item) => !orderedIds.has(item.id),
        );

        return {
          ...section,
          items: [...orderedItems, ...newItems],
        };
      }
      return section;
    });

    // Apply custom section ordering
    if (sidebarSectionOrder && sidebarSectionOrder.length > 0) {
      const sectionMap = new Map(
        sectionsWithOrderedItems.map((section) => [section.id, section]),
      );

      const orderedSections = sidebarSectionOrder
        .map((id) => sectionMap.get(id))
        .filter((section): section is MenuSection => section !== undefined);

      // Add any new sections that aren't in the saved order
      const orderedIds = new Set(sidebarSectionOrder);
      const newSections = sectionsWithOrderedItems.filter(
        (section) => !orderedIds.has(section.id),
      );

      return [...orderedSections, ...newSections];
    }

    return sectionsWithOrderedItems;
  }, [staticSections, dynamicSections, sidebarOrder, sidebarSectionOrder]);

  // Handle drag end event for items
  const handleDragEnd = (event: DragEndEvent, sectionTitle: string) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const section = menuSections.find((s) => s.title === sectionTitle);
    if (!section) return;

    const oldIndex = section.items.findIndex((item) => item.id === active.id);
    const newIndex = section.items.findIndex((item) => item.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newItems = arrayMove(section.items, oldIndex, newIndex);
      const newOrder = newItems.map((item) => item.id);

      setSidebarOrder({
        ...sidebarOrder,
        [sectionTitle]: newOrder,
      });
    }
  };

  // Handle drag end event for sections
  const handleSectionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = menuSections.findIndex(
      (section) => section.id === active.id,
    );
    const newIndex = menuSections.findIndex(
      (section) => section.id === over.id,
    );

    if (oldIndex !== -1 && newIndex !== -1) {
      const newSections = arrayMove(menuSections, oldIndex, newIndex);
      const newOrder = newSections.map((section) => section.id);
      setSidebarSectionOrder(newOrder);
    }
  };

  // Reset sidebar order
  const handleReset = () => {
    resetSidebarOrder();
    setIsEditMode(false);
  };

  return (
    <div className="h-screen flex flex-col bg-surface">
      {/* Logo */}
      <div
        className={cn(
          "flex items-center gap-2.5 border-b border-border",
          compactMode ? "px-3 py-4" : "px-5 py-6",
          sidebarCollapsed && "justify-center px-2",
        )}
      >
        {systemLogo ? (
          <div className="w-8 h-8 rounded-lg overflow-hidden bg-white border border-border shrink-0 flex items-center justify-center">
            <img
              src={systemLogo}
              alt="System Logo"
              className="w-full h-full object-contain"
            />
          </div>
        ) : (
          <div className="w-8 h-8 bg-primary rounded-lg shrink-0" />
        )}
        {!sidebarCollapsed && (
          <span className="text-xl font-bold text-primary">LGU Ims System</span>
        )}
      </div>

      {/* Edit Mode Controls */}
      {!sidebarCollapsed && (
        <div className="px-3 py-2 border-b border-border flex items-center gap-2">
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors",
              isEditMode
                ? "bg-success text-white"
                : "bg-background text-foreground hover:bg-surface",
            )}
            title={isEditMode ? "Exit edit mode" : "Customize sidebar"}
          >
            <Edit3 className="w-3.5 h-3.5" />
            {isEditMode ? "Done" : "Customize"}
          </button>
          {isEditMode && (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-background text-foreground hover:bg-surface transition-colors"
              title="Reset to default order"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          )}
        </div>
      )}

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {isEditMode && !sidebarCollapsed ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleSectionDragEnd}
          >
            <SortableContext
              items={menuSections.map((section) => section.id)}
              strategy={verticalListSortingStrategy}
            >
              {menuSections.map((section) => (
                <SortableSection
                  key={section.id}
                  section={section}
                  sidebarCollapsed={sidebarCollapsed}
                  compactMode={compactMode}
                  isEditMode={isEditMode}
                  location={location}
                  sensors={sensors}
                  onItemDragEnd={handleDragEnd}
                />
              ))}
            </SortableContext>
          </DndContext>
        ) : (
          <>
            {menuSections.map((section) => (
              <SortableSection
                key={section.id}
                section={section}
                sidebarCollapsed={sidebarCollapsed}
                compactMode={compactMode}
                isEditMode={false}
                location={location}
                sensors={sensors}
                onItemDragEnd={handleDragEnd}
              />
            ))}
          </>
        )}
      </nav>

      {/* Collapse Toggle */}
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className={cn(
          "absolute -right-3 top-1/2 -translate-y-1/2 z-50",
          "flex items-center justify-center w-6 h-6 rounded-full",
          "bg-success text-white cursor-pointer",
          "hover:bg-success/90 transition-colors shadow-md",
        )}
        aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {sidebarCollapsed ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronLeft className="w-4 h-4" />
        )}
      </button>
    </div>
  );
};

export default Sidebar;
