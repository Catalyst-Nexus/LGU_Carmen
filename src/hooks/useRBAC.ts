import { useContext } from "react";
import RBACContext from "@/contexts/RBACContext";
import type {
  RBACContextType,
  ModulePermissions,
} from "@/contexts/RBACContext";

export const useRBAC = (): RBACContextType => {
  const context = useContext(RBACContext);
  if (!context) {
    throw new Error("useRBAC must be used within an RBACProvider");
  }
  return context;
};

export const useModulePermissions = (
  moduleIdOrPath: string,
): ModulePermissions => {
  const { getModulePermissions } = useRBAC();
  return getModulePermissions(moduleIdOrPath);
};
