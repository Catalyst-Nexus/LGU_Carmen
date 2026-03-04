import { useState } from "react";
import { AssignmentList, AssignmentDialog } from "../../components/rbac";
import "./AssignmentManagement.css";

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
    className="amv-shine-border"
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

interface Assignment {
  id: string;
  description: string;
  status: "active" | "inactive";
  createdAt: string;
}

const AssignmentManagement = () => {
  const [assignments] = useState<Assignment[]>([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [description, setDescription] = useState("");

  const handleCreate = () => {
    // TODO: wire up to API
    setDescription("");
    setShowModal(false);
  };

  const total = assignments.length;
  const active = assignments.filter((a) => a.status === "active").length;
  const inactive = assignments.filter((a) => a.status === "inactive").length;

  return (
    <div className="amv-page">
      {/* Page Header */}
      <div className="amv-page-header">
        <h1 className="amv-page-title">Assignment Management</h1>
        <p className="amv-page-subtitle">
          Manage assignments in your role-based access control system
        </p>
      </div>

      {/* Stat Cards */}
      <div className="amv-stats-row">
        <div className="amv-stat-card">
          <ShineBorder />
          <span className="amv-stat-label">Total Assignments</span>
          <span className="amv-stat-value">{total}</span>
        </div>
        <div className="amv-stat-card">
          <ShineBorder shineColor={["#22c55e", "#4ade80"]} />
          <span className="amv-stat-label">Active Status</span>
          <span className="amv-stat-value amv-val-green">{active}</span>
        </div>
        <div className="amv-stat-card">
          <ShineBorder shineColor={["#f97316", "#fb923c"]} />
          <span className="amv-stat-label">Inactive Status</span>
          <span className="amv-stat-value amv-val-orange">{inactive}</span>
        </div>
      </div>

      {/* Add Button */}
      <div className="amv-actions-bar">
        <button className="amv-add-btn" onClick={() => setShowModal(true)}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M7 1v12M1 7h12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          Add Assignment
        </button>
      </div>

      {/* List Component */}
      <AssignmentList
        assignments={assignments}
        search={search}
        onSearchChange={setSearch}
        onEdit={(a: Assignment) => console.log("Edit", a)}
        onDelete={(id: string) => console.log("Delete", id)}
      />

      {/* Dialog Component */}
      <AssignmentDialog
        open={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleCreate}
        description={description}
        onDescriptionChange={setDescription}
      />
    </div>
  );
};

export default AssignmentManagement;
