import { useState } from "react";
import { RoleList, RoleDialog } from "../../components/rbac";
import "./RoleManagement.css";

// ─── Magic UI: ShineBorder ───────────────────────
const ShineBorder = ({
  shineColor = ["#22c55e", "#16a34a"],
  borderWidth = 1,
  duration = 10,
}: {
  shineColor?: string | string[];
  borderWidth?: number;
  duration?: number;
}) => (
  <span
    className="rmv-shine-border"
    style={{
      ["--border-width" as string]: `${borderWidth}px`,
      ["--duration" as string]: `${duration}s`,
      backgroundImage: `radial-gradient(transparent, transparent, ${
        Array.isArray(shineColor) ? shineColor.join(",") : shineColor
      }, transparent, transparent)`,
    }}
  />
);
// ─────────────────────────────────────────────────

interface Role {
  id: string;
  description: string;
  status: "active" | "inactive";
  createdAt: string;
}

const RoleManagement = () => {
  const [roles] = useState<Role[]>([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [description, setDescription] = useState("");

  const handleCreate = () => {
    // TODO: wire up to API
    setDescription("");
    setShowModal(false);
  };

  const total = roles.length;
  const active = roles.filter((r) => r.status === "active").length;
  const inactive = roles.filter((r) => r.status === "inactive").length;

  return (
    <div className="rmv-page">
      {/* Page Header */}
      <div className="rmv-page-header">
        <h1 className="rmv-page-title">
          <svg
            className="rmv-title-icon"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Role Management
        </h1>
        <p className="rmv-page-subtitle">
          Manage roles in your role-based access control system
        </p>
      </div>

      {/* Stat Cards */}
      <div className="rmv-stats-row">
        <div className="rmv-stat-card">
          <ShineBorder />
          <span className="rmv-stat-label">Total Roles</span>
          <span className="rmv-stat-value">{total}</span>
        </div>
        <div className="rmv-stat-card">
          <ShineBorder shineColor={["#22c55e", "#4ade80"]} />
          <span className="rmv-stat-label">Active Status</span>
          <span className="rmv-stat-value rmv-val-green">{active}</span>
        </div>
        <div className="rmv-stat-card">
          <ShineBorder shineColor={["#f97316", "#fb923c"]} />
          <span className="rmv-stat-label">Inactive Status</span>
          <span className="rmv-stat-value rmv-val-orange">{inactive}</span>
        </div>
      </div>

      {/* Add Button */}
      <div className="rmv-actions-bar">
        <button className="rmv-add-btn" onClick={() => setShowModal(true)}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M7 1v12M1 7h12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          Create Role
        </button>
      </div>

      {/* List Component */}
      <RoleList
        roles={roles}
        search={search}
        onSearchChange={setSearch}
        onEdit={(r: Role) => console.log("Edit", r)}
        onDelete={(id: string) => console.log("Delete", id)}
      />

      {/* Dialog Component */}
      <RoleDialog
        open={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleCreate}
        description={description}
        onDescriptionChange={setDescription}
      />
    </div>
  );
};

export default RoleManagement;
