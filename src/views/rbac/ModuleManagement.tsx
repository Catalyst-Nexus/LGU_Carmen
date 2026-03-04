import { useState } from "react";
import { ModuleList, ModuleDialog } from "../../components/rbac";
import "./ModuleManagement.css";

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
    className="mmv-shine-border"
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

interface Module {
  id: string;
  description: string;
  status: "active" | "inactive";
  createdAt: string;
}

const ModuleManagement = () => {
  const [modules] = useState<Module[]>([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [description, setDescription] = useState("");

  const handleCreate = () => {
    // TODO: wire up to API
    setDescription("");
    setShowModal(false);
  };

  const total = modules.length;
  const active = modules.filter((m) => m.status === "active").length;
  const inactive = modules.filter((m) => m.status === "inactive").length;

  return (
    <div className="mmv-page">
      {/* Page Header */}
      <div className="mmv-page-header">
        <h1 className="mmv-page-title">Module Management</h1>
        <p className="mmv-page-subtitle">
          Manage modules in your role-based access control system
        </p>
      </div>

      {/* Stat Cards */}
      <div className="mmv-stats-row">
        <div className="mmv-stat-card">
          <ShineBorder />
          <span className="mmv-stat-label">Total Modules</span>
          <span className="mmv-stat-value">{total}</span>
        </div>
        <div className="mmv-stat-card">
          <ShineBorder shineColor={["#22c55e", "#4ade80"]} />
          <span className="mmv-stat-label">Active Status</span>
          <span className="mmv-stat-value mmv-val-green">{active}</span>
        </div>
        <div className="mmv-stat-card">
          <ShineBorder shineColor={["#f97316", "#fb923c"]} />
          <span className="mmv-stat-label">Inactive Status</span>
          <span className="mmv-stat-value mmv-val-orange">{inactive}</span>
        </div>
      </div>

      {/* Add Button */}
      <div className="mmv-actions-bar">
        <button className="mmv-add-btn" onClick={() => setShowModal(true)}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M7 1v12M1 7h12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          Add Module
        </button>
      </div>

      {/* List Component */}
      <ModuleList
        modules={modules}
        search={search}
        onSearchChange={setSearch}
        onEdit={(m: Module) => console.log("Edit", m)}
        onDelete={(id: string) => console.log("Delete", id)}
      />

      {/* Dialog Component */}
      <ModuleDialog
        open={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleCreate}
        description={description}
        onDescriptionChange={setDescription}
      />
    </div>
  );
};

export default ModuleManagement;
