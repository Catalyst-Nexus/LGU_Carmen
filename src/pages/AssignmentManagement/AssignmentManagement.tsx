import { useState } from "react";
import "./AssignmentManagement.css";

// ─── Magic UI: ShineBorder (inline, no Tailwind needed) ───────────────────────
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
    className="am-shine-border"
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

interface Assignment {
  id: string;
  description: string;
  status: "active" | "inactive";
  createdAt: string;
}

const AssignmentManagement = () => {
  // TODO: Replace with actual data from API
  const [assignments] = useState<Assignment[]>([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [description, setDescription] = useState("");

  const handleCreate = () => {
    // TODO: wire up to API
    setDescription("");
    setShowModal(false);
  };

  const filtered = assignments.filter(
    (a) =>
      a.id.toLowerCase().includes(search.toLowerCase()) ||
      a.description.toLowerCase().includes(search.toLowerCase()),
  );

  const total = assignments.length;
  const active = assignments.filter((a) => a.status === "active").length;
  const inactive = assignments.filter((a) => a.status === "inactive").length;

  return (
    <div className="am-page">
      {/* Page Header */}
      <div className="am-page-header">
        <h1 className="am-page-title">Assignment Management</h1>
        <p className="am-page-subtitle">
          Manage assignments in your role-based access control system
        </p>
      </div>

      {/* Stat Cards */}
      <div className="am-stats-row">
        <div className="am-stat-card">
          <ShineBorder />
          <span className="am-stat-label">Total Assignments</span>
          <span className="am-stat-value">{total}</span>
        </div>
        <div className="am-stat-card">
          <ShineBorder shineColor={["#22c55e", "#4ade80"]} />
          <span className="am-stat-label">Active Status</span>
          <span className="am-stat-value am-val-green">{active}</span>
        </div>
        <div className="am-stat-card">
          <ShineBorder shineColor={["#f97316", "#fb923c"]} />
          <span className="am-stat-label">Inactive Status</span>
          <span className="am-stat-value am-val-orange">{inactive}</span>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="am-table-card">
        <ShineBorder duration={14} />

        <div className="am-card-header">
          <h2 className="am-card-title">Assignment Management</h2>
          <button className="am-add-btn" onClick={() => setShowModal(true)}>
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
            Add Assignment
          </button>
        </div>

        <div className="am-search-row">
          <div className="am-search-wrap">
            <svg
              className="am-search-icon"
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
              className="am-search-input"
              placeholder="Search assignments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="am-table-wrap">
          <table className="am-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Description</th>
                <th>Status</th>
                <th>Created At</th>
                <th className="am-th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="am-empty-cell">
                    No assignments found. Click "Add Assignment" to get started.
                  </td>
                </tr>
              ) : (
                filtered.map((a) => (
                  <tr key={a.id} className="am-tr">
                    <td className="am-td-id">{a.id}</td>
                    <td>{a.description}</td>
                    <td>
                      <span
                        className={`am-status-badge ${
                          a.status === "active"
                            ? "am-badge-active"
                            : "am-badge-inactive"
                        }`}
                      >
                        {a.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>{a.createdAt}</td>
                    <td className="am-td-actions">
                      <button className="am-icon-btn" title="Edit">
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
                      <button className="am-icon-btn" title="Delete">
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

      {/* Create Assignment Modal */}
      {showModal && (
        <div className="am-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="am-modal" onClick={(e) => e.stopPropagation()}>
            <div className="am-modal-header">
              <h2 className="am-modal-title">Create New Assignment</h2>
              <button
                className="am-modal-close"
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

            <div className="am-modal-body">
              <label className="am-modal-label" htmlFor="am-desc">
                Description
              </label>
              <textarea
                id="am-desc"
                className="am-modal-textarea"
                placeholder="Enter assignment description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            <div className="am-modal-footer">
              <button
                className="am-modal-cancel"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button className="am-modal-create" onClick={handleCreate}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignmentManagement;
