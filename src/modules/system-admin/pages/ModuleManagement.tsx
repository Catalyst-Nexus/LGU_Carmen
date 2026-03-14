import { useState, useEffect } from "react";
import { ModuleList, ModuleDialog } from "@/modules/system-admin/components";
import {
  PageHeader,
  StatsRow,
  StatCard,
  ActionsBar,
  PrimaryButton,
} from "@/components/ui";
import { Blocks, Plus } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/services/supabase";
import { availableIcons } from "@/lib/iconMap";

interface Module {
  id: string;
  module_name: string;
  route_path: string;
  icons: string | null;
  file_path: string | null;
  category: string | null;
  is_active: boolean;
  created_at: string;
}

const ModuleManagement = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [moduleName, setModuleName] = useState("");
  const [routePath, setRoutePath] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("");
  const [filePath, setFilePath] = useState("");
  const [category, setCategory] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      if (!isSupabaseConfigured() || !supabase) {
        console.log("Supabase not configured");
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("modules")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchError) {
        console.error("Fetch modules error:", fetchError);
        return;
      }

      setModules(data || []);
    } catch (err) {
      console.error("Error fetching modules:", err);
    }
  };

  const handleCreate = async () => {
    if (
      !moduleName.trim() ||
      !routePath.trim() ||
      !filePath.trim() ||
      !category.trim()
    ) {
      setError("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      if (!isSupabaseConfigured() || !supabase) {
        setError("Supabase is not configured");
        return;
      }

      // If editing, update the module
      if (editingModuleId) {
        const { data, error: updateError } = await supabase
          .from("modules")
          .update({
            module_name: moduleName.trim(),
            route_path: routePath.trim(),
            icons: selectedIcon || null,
            file_path: filePath.trim(),
            category: category.trim() || null,
            is_active: isActive,
          })
          .eq("id", editingModuleId)
          .select();

        if (updateError) {
          console.error("Update module error:", updateError);
          setError(updateError.message);
          return;
        }

        // Update module in list
        if (data && data.length > 0) {
          setModules(
            modules.map((m) => (m.id === editingModuleId ? data[0] : m)),
          );
        }
      } else {
        // Create new module
        const { data, error: insertError } = await supabase
          .from("modules")
          .insert({
            module_name: moduleName.trim(),
            route_path: routePath.trim(),
            icons: selectedIcon || null,
            file_path: filePath.trim(),
            category: category.trim() || null,
            is_active: isActive,
          })
          .select();

        if (insertError) {
          console.error("Insert module error:", insertError);
          setError(insertError.message);
          return;
        }

        // Add new module to list
        if (data && data.length > 0) {
          setModules([data[0], ...modules]);
        }
      }

      // Reset form and close modal
      setModuleName("");
      setRoutePath("");
      setSelectedIcon("");
      setFilePath("");
      setCategory("");
      setIsActive(true);
      setEditingModuleId(null);
      setShowModal(false);
      setError("");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save module";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this module?")) return;

    try {
      if (!isSupabaseConfigured() || !supabase) {
        setError("Supabase is not configured");
        return;
      }

      const { error: deleteError } = await supabase
        .from("modules")
        .delete()
        .eq("id", id);

      if (deleteError) {
        setError(deleteError.message);
        return;
      }

      setModules(modules.filter((m) => m.id !== id));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete module";
      setError(message);
    }
  };

  const handleEdit = (module: Module) => {
    setModuleName(module.module_name);
    setRoutePath(module.route_path);
    setSelectedIcon(module.icons || "");
    setFilePath(module.file_path || "");
    setCategory(module.category || "");
    setIsActive(module.is_active);
    setEditingModuleId(module.id);
    setShowModal(true);
  };

  const total = modules.length;
  const active = modules.filter((m) => m.is_active).length;
  const inactive = modules.filter((m) => !m.is_active).length;
  const existingCategories = Array.from(
    new Set(modules.map((m) => m.category).filter((c): c is string => !!c))
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Module Management"
        subtitle="Manage modules in your role-based access control system"
        icon={<Blocks className="w-6 h-6" />}
      />

      <StatsRow>
        <StatCard label="Total Modules" value={total} />
        <StatCard label="Active Status" value={active} color="success" />
        <StatCard label="Inactive Status" value={inactive} color="warning" />
      </StatsRow>

      <ActionsBar>
        <PrimaryButton
          onClick={() => {
            setModuleName("");
            setRoutePath("");
            setSelectedIcon("");
            setFilePath("");
            setCategory("");
            setIsActive(true);
            setEditingModuleId(null);
            setError("");
            setShowModal(true);
          }}
        >
          <Plus className="w-4 h-4" />
          Add Module
        </PrimaryButton>
      </ActionsBar>

      {error && (
        <div className="px-4 py-3 bg-red-100 border border-red-300 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <ModuleList
        modules={modules}
        search={search}
        onSearchChange={setSearch}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <ModuleDialog
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setError("");
          setEditingModuleId(null);
          setModuleName("");
          setRoutePath("");
          setSelectedIcon("");
          setFilePath("");
          setCategory("");
          setIsActive(true);
        }}
        onSubmit={handleCreate}
        moduleName={moduleName}
        onModuleNameChange={setModuleName}
        routePath={routePath}
        onRoutePathChange={setRoutePath}
        selectedIcon={selectedIcon}
        onSelectedIconChange={setSelectedIcon}
        filePath={filePath}
        onFilePathChange={setFilePath}
        category={category}
        onCategoryChange={setCategory}
        isActive={isActive}
        onIsActiveChange={setIsActive}
        availableIcons={availableIcons}
        isLoading={isLoading}
        editMode={!!editingModuleId}
        existingCategories={existingCategories}
      />
    </div>
  );
};

export default ModuleManagement;
