import { useState } from "react";
import "./ModuleManagement.css";

// ─── Magic UI: ShineBorder (inline) ──────────────────────────────────
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
    className="mm-shine-border"
    style={{
      ["--border-width" as string]: `${borderWidth}px`,
      ["--duration" as string]: `${duration}s`,
      backgroundImage: `radial-gradient(transparent, transparent, ${
        Array.isArray(shineColor) ? shineColor.join(",") : shineColor
      }, transparent, transparent)`,
    }}
  />
);
// ───────────────────────────────────────────────────────────────────

interface Module {
  id: string;
  description: string;
  status: "active" | "inactive";
  createdAt: string;
}

const ModuleManagement = () => {
  // TODO: Replace with actual data from API
  const [modules] = useState<Module[]>([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");

  const filtered = modules.filter(
    (m) =>
      m.id.toLowerCase().includes(search.toLowerCase()) ||
      m.description.toLowerCase().includes(search.toLowerCase()),
  );

  const total = modules.length;
  const active = modules.filter((m) => m.status === "active").length;
  const inactive = modules.filter((m) => m.status === "inactive").length;

  const handleCreate = () => {
    // TODO: wire up to API
    setFormName("");
    setFormDesc("");
    setShowModal(false);
  };

  return (
    <div className="mm-page">
      {/* Page Header */}
      <div className="mm-page-header">
        <h1 className="mm-page-title">Module Management</h1>
        <p className="mm-page-subtitle">
          Manage modules in your role-based access control system
        </p>
      </div>

      {/* Stat Cards */}
      <div className="mm-stats-row">
        <div className="mm-stat-card">
          <ShineBorder />
          <span className="mm-stat-label">Total Modules</span>
          <span className="mm-stat-value">{total}</span>
        </div>
        <div className="mm-stat-card">
          <ShineBorder shineColor={["#22c55e", "#4ade80"]} />
          <span className="mm-stat-label">Active Modules</span>
          <span className="mm-stat-value mm-val-green">{active}</span>
        </div>
        <div className="mm-stat-card">
          <ShineBorder shineColor={["#f97316", "#fb923c"]} />
          <span className="mm-stat-label">Inactive Modules</span>
          <span className="mm-stat-value mm-val-orange">{inactive}</span>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="mm-table-card">
        <ShineBorder duration={14} />

        <div className="mm-card-header">
          <h2 className="mm-card-title">Module Management</h2>
          <button className="mm-add-btn" onClick={() => setShowModal(true)}>
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
            Add Module
          </button>
        </div>

        <div className="mm-search-row">
          <div className="mm-search-wrap">
            <svg
              className="mm-search-icon"
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
              className="mm-search-input"
              placeholder="Search modules..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="mm-table-wrap">
          <table className="mm-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Description</th>
                <th>Status</th>
                <th>Created At</th>
                <th className="mm-th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="mm-empty-cell">
                    No modules found. Click “Add Module” to get started.
                  </td>
                </tr>
              ) : (
                filtered.map((m) => (
                  <tr key={m.id} className="mm-tr">
                    <td className="mm-td-id">{m.id}</td>
                    <td>{m.description}</td>
                    <td>
                      <span
                        className={`mm-status-badge ${
                          m.status === "active"
                            ? "mm-badge-active"
                            : "mm-badge-inactive"
                        }`}
                      >
                        {m.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>{m.createdAt}</td>
                    <td className="mm-td-actions">
                      <button className="mm-icon-btn" title="Edit">
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
                      <button className="mm-icon-btn" title="Delete">
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

      {/* Create Module Modal */}
      {showModal && (
        <div className="mm-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="mm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mm-modal-header">
              <h2 className="mm-modal-title">Create New Module</h2>
              <button
                className="mm-modal-close"
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

            <div className="mm-modal-body">
              <label className="mm-modal-label" htmlFor="mm-name">
                Module Name
              </label>
              <input
                id="mm-name"
                type="text"
                className="mm-modal-input"
                placeholder="Enter module name..."
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />

              <label className="mm-modal-label" htmlFor="mm-desc">
                Description
              </label>
              <textarea
                id="mm-desc"
                className="mm-modal-textarea"
                placeholder="Enter module description..."
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                rows={4}
              />
            </div>

            <div className="mm-modal-footer">
              <button
                className="mm-modal-cancel"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button className="mm-modal-create" onClick={handleCreate}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModuleManagement;
