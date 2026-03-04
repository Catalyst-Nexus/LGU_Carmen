import { useState } from "react";
import "./UserManagement.css";

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
    className="um-shine-border"
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

const TABS = [
  "Users",
  "User Assignments",
  "User Roles",
  "Role Module Access",
] as const;
type Tab = (typeof TABS)[number];

interface User {
  id: string;
  name: string;
  email: string;
  status: "active" | "inactive";
  registeredAt: string;
}

const UserManagement = () => {
  // TODO: Replace with actual data from API
  const [users] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("Users");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  const total = users.length;
  const active = users.filter((u) => u.status === "active").length;
  const inactive = users.filter((u) => u.status === "inactive").length;

  const handleCreate = () => {
    // TODO: wire up to API
    setFormName("");
    setFormEmail("");
    setShowModal(false);
  };

  return (
    <div className="um-page">
      {/* Page Header */}
      <div className="um-page-header">
        <h1 className="um-page-title">User Management</h1>
        <p className="um-page-subtitle">
          Manage user assignments, roles, and role module access in your RBAC
          system
        </p>
      </div>

      {/* Stat Cards */}
      <div className="um-stats-row">
        <div className="um-stat-card">
          <ShineBorder />
          <span className="um-stat-label">Total Users</span>
          <span className="um-stat-value">{total}</span>
        </div>
        <div className="um-stat-card">
          <ShineBorder shineColor={["#22c55e", "#4ade80"]} />
          <span className="um-stat-label">Active Users</span>
          <span className="um-stat-value um-val-green">{active}</span>
        </div>
        <div className="um-stat-card">
          <ShineBorder shineColor={["#f97316", "#fb923c"]} />
          <span className="um-stat-label">Inactive Users</span>
          <span className="um-stat-value um-val-orange">{inactive}</span>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="um-tabs">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`um-tab ${activeTab === tab ? "um-tab-active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main Table Card */}
      <div className="um-table-card">
        <ShineBorder duration={14} />

        <div className="um-card-header">
          <h2 className="um-card-title">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              style={{ marginRight: 8, verticalAlign: "middle" }}
            >
              <path
                d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx="9"
                cy="7"
                r="4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M23 21v-2a4 4 0 0 0-3-3.87"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M16 3.13a4 4 0 0 1 0 7.75"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            System Users
          </h2>
        </div>

        <div className="um-toolbar">
          <div className="um-search-wrap">
            <svg
              className="um-search-icon"
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
              className="um-search-input"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="um-toolbar-right">
            <div className="um-filter-select">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <polygon
                  points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <select className="um-select" aria-label="Filter users">
                <option>All Users</option>
                <option>Active Only</option>
                <option>Inactive Only</option>
              </select>
            </div>

            <div className="um-filter-select">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M7 16V4m0 0L3 8m4-4 4 4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M17 8v12m0 0 4-4m-4 4-4-4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <select className="um-select" aria-label="Sort by">
                <option>Email</option>
                <option>Name</option>
                <option>Status</option>
              </select>
            </div>

            <button className="um-sort-btn">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M12 5v14m0 0 7-7m-7 7-7-7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Desc
            </button>
          </div>
        </div>

        <div className="um-table-wrap">
          <table className="um-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Registered</th>
                <th className="um-th-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="um-empty-cell">
                    No users found. Click “Add User” to get started.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className="um-tr">
                    <td className="um-td-name">{u.name}</td>
                    <td>{u.email}</td>
                    <td>
                      <span
                        className={`um-status-badge ${
                          u.status === "active"
                            ? "um-badge-active"
                            : "um-badge-inactive"
                        }`}
                      >
                        {u.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>{u.registeredAt}</td>
                    <td className="um-td-actions">
                      <button className="um-icon-btn" title="Edit">
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
                      <button className="um-icon-btn" title="Delete">
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

      {/* Create User Modal */}
      {showModal && (
        <div className="um-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="um-modal" onClick={(e) => e.stopPropagation()}>
            <div className="um-modal-header">
              <h2 className="um-modal-title">Add New User</h2>
              <button
                className="um-modal-close"
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

            <div className="um-modal-body">
              <label className="um-modal-label" htmlFor="um-name">
                Name
              </label>
              <input
                id="um-name"
                type="text"
                className="um-modal-input"
                placeholder="Enter user name..."
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />

              <label className="um-modal-label" htmlFor="um-email">
                Email
              </label>
              <input
                id="um-email"
                type="email"
                className="um-modal-input"
                placeholder="Enter email address..."
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
              />
            </div>

            <div className="um-modal-footer">
              <button
                className="um-modal-cancel"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button className="um-modal-create" onClick={handleCreate}>
                Create User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
