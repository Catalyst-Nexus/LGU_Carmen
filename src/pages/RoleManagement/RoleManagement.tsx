import { useState } from "react";
import "./RoleManagement.css";

// ─── Magic UI: ShineBorder (inline) ──────────────────────────────────────────
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
    className="rm-shine-border"
    style={{
      ["--border-width" as string]: `${borderWidth}px`,
      ["--duration" as string]: `${duration}s`,
      backgroundImage: `radial-gradient(transparent, transparent, ${
        Array.isArray(shineColor) ? shineColor.join(",") : shineColor
      }, transparent, transparent)`,
    }}
  />
);
// ─────────────────────────────────────────────────────────────────────────────

interface Role {
  id: string;
  description: string;
  status: "active" | "inactive";
  createdAt: string;
}

const RoleManagement = () => {
  // TODO: Replace with actual data from API
  const [roles] = useState<Role[]>([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");

  const filtered = roles.filter(
    (r) =>
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase()),
  );

  const total = roles.length;
  const active = roles.filter((r) => r.status === "active").length;
  const inactive = roles.filter((r) => r.status === "inactive").length;

  const handleCreate = () => {
    // TODO: wire up to API
    setFormName("");
    setFormDesc("");
    setShowModal(false);
  };

  return (
    <div className="rm-page">
      {/* Page Header */}
      <div className="rm-page-header">
        <h1 className="rm-page-title">Role Management</h1>
        <p className="rm-page-subtitle">
          Manage roles in your role-based access control system
        </p>
      </div>

      {/* Stat Cards */}
      <div className="rm-stats-row">
        <div className="rm-stat-card">
          <ShineBorder />
          <span className="rm-stat-label">Total Roles</span>
          <span className="rm-stat-value">{total}</span>
        </div>
        <div className="rm-stat-card">
          <ShineBorder shineColor={["#22c55e", "#4ade80"]} />
          <span className="rm-stat-label">Active Roles</span>
          <span className="rm-stat-value rm-val-green">{active}</span>
        </div>
        <div className="rm-stat-card">
          <ShineBorder shineColor={["#f97316", "#fb923c"]} />
          <span className="rm-stat-label">Inactive Roles</span>
          <span className="rm-stat-value rm-val-orange">{inactive}</span>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rm-table-card">
        <ShineBorder duration={14} />

        <div className="rm-card-header">
          <h2 className="rm-card-title">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              style={{ marginRight: 8, verticalAlign: "middle" }}
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
          </h2>
          <button className="rm-add-btn" onClick={() => setShowModal(true)}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              aria-hidden="true"
            >
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

        <div className="rm-search-row">
          <div className="rm-search-wrap">
            <svg
              className="rm-search-icon"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                cx="11"
                cy="11"
                r="8"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="m21 21-4.35-4.35"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <input
              type="text"
              className="rm-search-input"
              placeholder="Search roles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="rm-table-wrap">
          <table className="rm-table">
            <thead>
              <tr>
                <th>Role ID</th>
                <th>Description</th>
                <th>Status</th>
                <th>Created At</th>
                <th className="rm-th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="rm-empty-cell">
                    No roles found. Click “Create Role” to get started.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="rm-tr">
                    <td className="rm-td-id">{r.id}</td>
                    <td>{r.description}</td>
                    <td>
                      <span
                        className={`rm-status-badge ${
                          r.status === "active"
                            ? "rm-badge-active"
                            : "rm-badge-inactive"
                        }`}
                      >
                        {r.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>{r.createdAt}</td>
                    <td className="rm-td-actions">
                      <button className="rm-icon-btn" title="Edit">
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                      <button className="rm-icon-btn" title="Delete">
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <polyline
                            points="3 6 5 6 21 6"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M10 11v6M14 11v6"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                          <path
                            d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Role Modal */}
      {showModal && (
        <div className="rm-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="rm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rm-modal-header">
              <h2 className="rm-modal-title">Create New Role</h2>
              <button
                className="rm-modal-close"
                onClick={() => setShowModal(false)}
                aria-label="Close"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M18 6 6 18M6 6l12 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <div className="rm-modal-body">
              <label className="rm-modal-label" htmlFor="rm-name">
                Role Name
              </label>
              <input
                id="rm-name"
                type="text"
                className="rm-modal-input"
                placeholder="Enter role name..."
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />

              <label className="rm-modal-label" htmlFor="rm-desc">
                Description
              </label>
              <textarea
                id="rm-desc"
                className="rm-modal-textarea"
                placeholder="Enter role description..."
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                rows={4}
              />
            </div>

            <div className="rm-modal-footer">
              <button
                className="rm-modal-cancel"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button className="rm-modal-create" onClick={handleCreate}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleManagement;
