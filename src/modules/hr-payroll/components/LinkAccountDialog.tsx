import { useState, useEffect } from "react";
import { BaseDialog } from "@/components/ui/dialog";
import { supabase, isSupabaseConfigured } from "@/services/supabase";
import type { Employee } from "@/types/hr.types";

interface PendingUser {
  id: string;
  username: string;
  email: string;
}

interface LinkAccountDialogProps {
  open: boolean;
  onClose: () => void;
  /** The personnel record being linked/unlinked */
  employee: Employee | null;
  /** All user_ids already claimed by other personnel rows — excluded from the dropdown */
  linkedUserIds: string[];
  /** Called after a successful save; userId is null when unlinked */
  onLinked: (personnelId: string, userId: string | null) => void;
}

const LinkAccountDialog = ({
  open,
  onClose,
  employee,
  linkedUserIds,
  onLinked,
}: LinkAccountDialogProps) => {
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Fetch active pending_users whenever the dialog opens
  useEffect(() => {
    if (!open || !isSupabaseConfigured() || !supabase) return;
    setIsFetching(true);
    setSaveError(null);

    supabase
      .from("pending_users")
      .select("id, username, email")
      .eq("is_confirmed", true)
      .order("username")
      .then(({ data, error }) => {
        if (error) {
          console.error("Error fetching users:", error);
          setIsFetching(false);
          return;
        }

        // Exclude user_ids already linked to OTHER personnel records
        const otherLinkedIds = new Set(
          linkedUserIds.filter((uid) => uid !== employee?.user_id),
        );
        setUsers(
          ((data as PendingUser[]) || []).filter(
            (u) => !otherLinkedIds.has(u.id),
          ),
        );
        // Pre-select the currently linked account (if any)
        setSelectedUserId(employee?.user_id ?? "");
        setIsFetching(false);
      });
  }, [open, employee, linkedUserIds]);

  const handleSubmit = async () => {
    if (!employee || !supabase) return;
    setIsSaving(true);
    setSaveError(null);

    const userIdToSet: string | null = selectedUserId || null;

    const { error } = await supabase
      .schema("hr")
      .from("personnel")
      .update({ user_id: userIdToSet })
      .eq("id", employee.id);

    setIsSaving(false);
    if (error) {
      setSaveError(error.message);
      return;
    }

    onLinked(employee.id, userIdToSet);
    onClose();
  };

  if (!employee) return null;

  const employeeName = `${employee.last_name}, ${employee.first_name}${employee.middle_name ? " " + employee.middle_name : ""}`;

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title="Link System Account"
      onSubmit={handleSubmit}
      submitLabel="Save"
      isLoading={isSaving}
    >
      <div className="space-y-4">
        <p className="text-sm text-muted">
          Linking an account allows this employee to log in and access the
          system using their assigned roles and permissions.
        </p>

        {/* Employee being linked */}
        <div className="p-3 rounded-lg bg-background border border-border">
          <p className="text-xs font-medium uppercase tracking-wider text-muted mb-0.5">
            Employee
          </p>
          <p className="text-sm font-semibold text-foreground">
            {employeeName}
          </p>
          <p className="text-xs text-muted">
            {employee.position_title} · {employee.office_name}
          </p>
        </div>

        {/* Account dropdown */}
        <div>
          <label
            htmlFor="link-account-select"
            className="block text-sm font-medium text-foreground mb-1"
          >
            System Account
          </label>
          {isFetching ? (
            <p className="text-sm text-muted py-2">Loading accounts…</p>
          ) : (
            <select
              id="link-account-select"
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:border-accent"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              <option value="">— No account (unlink) —</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.username} ({u.email})
                </option>
              ))}
            </select>
          )}
          {users.length === 0 && !isFetching && (
            <p className="mt-1.5 text-xs text-muted">
              No unlinked active accounts available. Activate a user account
              first via System Admin → User Activation.
            </p>
          )}
        </div>

        {/* Error */}
        {saveError && (
          <p className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
            {saveError}
          </p>
        )}
      </div>
    </BaseDialog>
  );
};

export default LinkAccountDialog;
