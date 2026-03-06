import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { supabase, isSupabaseConfigured } from "@/services/supabase";
import { useAuthStore } from "@/store";

export interface Module {
  id: string;
  module_name: string;
  route_path: string;
  icons: string | null;
  is_active: boolean;
  created_at: string;
  file_path?: string | null;
  category?: string | null;
}

export interface RolePermission {
  id: string;
  role_id: string;
  module_id: string;
  can_select: boolean;
  can_insert: boolean;
  can_update: boolean;
  can_delete: boolean;
  created_at: string;
}

export interface ModulePermissions {
  canSelect: boolean;
  canInsert: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

interface RBACContextType {
  modules: Module[];
  userModules: Module[];
  userPermissions: RolePermission[];
  isLoading: boolean;
  isSuperAdmin: boolean;
  hasModuleAccess: (moduleIdOrPath: string) => boolean;
  hasPermission: (
    moduleIdOrPath: string,
    action: "select" | "insert" | "update" | "delete",
  ) => boolean;
  getModulePermissions: (moduleIdOrPath: string) => ModulePermissions;
  refreshPermissions: () => Promise<void>;
}

const RBACContext = createContext<RBACContextType | undefined>(undefined);

export const RBACProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const user = useAuthStore((state) => state.user);
  const [modules, setModules] = useState<Module[]>([]);
  const [userModules, setUserModules] = useState<Module[]>([]);
  const [userPermissions, setUserPermissions] = useState<RolePermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isSuperAdmin = user?.is_super_admin ?? false;

  const fetchAllModules = useCallback(async () => {
    if (!isSupabaseConfigured() || !supabase) return [];

    const { data, error } = await supabase
      .from("modules")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching modules:", error);
      return [];
    }

    return data || [];
  }, []);

  const fetchUserPermissions = useCallback(async (): Promise<{
    permissions: RolePermission[];
    moduleIds: string[];
  }> => {
    if (!isSupabaseConfigured() || !supabase || !user) {
      return { permissions: [], moduleIds: [] };
    }

    try {
      // Step 1: Get user's roles
      const { data: userRoles, error: userRolesError } = await supabase
        .from("user_roles")
        .select("role_id")
        .eq("user_id", user.id);

      if (userRolesError) {
        console.error("Error fetching user roles:", userRolesError);
        return { permissions: [], moduleIds: [] };
      }

      const roleIds = userRoles?.map((ur) => ur.role_id) || [];

      if (roleIds.length === 0) {
        console.log("User has no roles assigned");
        return { permissions: [], moduleIds: [] };
      }

      // Step 2: Get role_permissions for those roles (new schema with booleans)
      const { data: rolePermissions, error: rolesPermError } = await supabase
        .from("role_permissions")
        .select("*")
        .in("role_id", roleIds);

      if (rolesPermError) {
        console.error("Error fetching role permissions:", rolesPermError);
        return { permissions: [], moduleIds: [] };
      }

      // Filter to only include permissions where at least one action is enabled
      const validPermissions = (rolePermissions || []).filter(
        (rp) =>
          rp.can_select || rp.can_insert || rp.can_update || rp.can_delete,
      ) as RolePermission[];

      // Get unique module IDs from valid permissions
      const moduleIds = [...new Set(validPermissions.map((p) => p.module_id))];

      return {
        permissions: validPermissions,
        moduleIds,
      };
    } catch (err) {
      console.error("Error in fetchUserPermissions:", err);
      return { permissions: [], moduleIds: [] };
    }
  }, [user]);

  const refreshPermissions = useCallback(async () => {
    setIsLoading(true);

    try {
      // Fetch all active modules
      const allModules = await fetchAllModules();
      setModules(allModules);

      if (!user) {
        setUserModules([]);
        setUserPermissions([]);
        setIsLoading(false);
        return;
      }

      // Super admin has access to all modules
      if (isSuperAdmin) {
        setUserModules(allModules);
        setUserPermissions([]);
        setIsLoading(false);
        return;
      }

      // Fetch user permissions and accessible modules based on role permissions
      const { permissions, moduleIds } = await fetchUserPermissions();
      setUserPermissions(permissions);

      // Filter modules based on user's permissions
      const accessibleModules = allModules.filter((m) =>
        moduleIds.includes(m.id),
      );
      setUserModules(accessibleModules);
    } catch (err) {
      console.error("Error refreshing permissions:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user, isSuperAdmin, fetchAllModules, fetchUserPermissions]);

  // Check if user has access to a module (by id or route_path)
  const hasModuleAccess = useCallback(
    (moduleIdOrPath: string): boolean => {
      if (isSuperAdmin) return true;

      return userModules.some(
        (m) => m.id === moduleIdOrPath || m.route_path === moduleIdOrPath,
      );
    },
    [isSuperAdmin, userModules],
  );

  // Check if user has a specific permission for a module
  const hasPermission = useCallback(
    (
      moduleIdOrPath: string,
      action: "select" | "insert" | "update" | "delete",
    ): boolean => {
      if (isSuperAdmin) return true;

      // Find the module by id or path
      const module = modules.find(
        (m) => m.id === moduleIdOrPath || m.route_path === moduleIdOrPath,
      );

      if (!module) return false;

      // Check if any of the user's permissions grant the action for this module
      return userPermissions.some((p) => {
        if (p.module_id !== module.id) return false;
        switch (action) {
          case "select":
            return p.can_select;
          case "insert":
            return p.can_insert;
          case "update":
            return p.can_update;
          case "delete":
            return p.can_delete;
          default:
            return false;
        }
      });
    },
    [isSuperAdmin, userPermissions, modules],
  );

  // Get all permissions for a specific module
  const getModulePermissions = useCallback(
    (moduleIdOrPath: string): ModulePermissions => {
      // Super admin has all permissions
      if (isSuperAdmin) {
        return {
          canSelect: true,
          canInsert: true,
          canUpdate: true,
          canDelete: true,
        };
      }

      // Find the module by id or path
      const module = modules.find(
        (m) => m.id === moduleIdOrPath || m.route_path === moduleIdOrPath,
      );

      if (!module) {
        return {
          canSelect: false,
          canInsert: false,
          canUpdate: false,
          canDelete: false,
        };
      }

      // Aggregate permissions from all role permissions for this module
      // (user might have multiple roles with different permissions)
      const modulePerms = userPermissions.filter(
        (p) => p.module_id === module.id,
      );

      return {
        canSelect: modulePerms.some((p) => p.can_select),
        canInsert: modulePerms.some((p) => p.can_insert),
        canUpdate: modulePerms.some((p) => p.can_update),
        canDelete: modulePerms.some((p) => p.can_delete),
      };
    },
    [isSuperAdmin, userPermissions, modules],
  );

  // Fetch permissions on mount and when user changes
  useEffect(() => {
    refreshPermissions();
  }, [refreshPermissions]);

  // Subscribe to real-time changes
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;

    const subscription = supabase
      .channel("rbac_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "modules" },
        () => {
          refreshPermissions();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "role_permissions" },
        () => {
          refreshPermissions();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_roles" },
        () => {
          refreshPermissions();
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshPermissions]);

  return (
    <RBACContext.Provider
      value={{
        modules,
        userModules,
        userPermissions,
        isLoading,
        isSuperAdmin,
        hasModuleAccess,
        hasPermission,
        getModulePermissions,
        refreshPermissions,
      }}
    >
      {children}
    </RBACContext.Provider>
  );
};

export const useRBAC = (): RBACContextType => {
  const context = useContext(RBACContext);
  if (!context) {
    throw new Error("useRBAC must be used within an RBACProvider");
  }
  return context;
};

// Custom hook for getting permissions for a specific module
export const useModulePermissions = (
  moduleIdOrPath: string,
): ModulePermissions => {
  const { getModulePermissions } = useRBAC();
  return getModulePermissions(moduleIdOrPath);
};

export default RBACContext;
