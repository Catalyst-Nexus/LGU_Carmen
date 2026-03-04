import { useState } from "react";
import { UserList, UserDialog } from "../../components/rbac";
import "./UserManagement.css";

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
    className="umv-shine-border"
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

interface User {
  id: string;
  name: string;
  email: string;
  status: "active" | "inactive";
  registeredAt: string;
}

type TabKey = "users" | "assignments" | "roles" | "access";

const tabs: { key: TabKey; label: string }[] = [
  { key: "users", label: "Users" },
  { key: "assignments", label: "User Assignments" },
  { key: "roles", label: "User Roles" },
  { key: "access", label: "Role Module Access" },
];

const UserManagement = () => {
  const [users] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("users");
  const [showModal, setShowModal] = useState(false);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");

  const handleCreate = () => {
    // TODO: wire up to API
    setFormName("");
    setFormEmail("");
    setShowModal(false);
  };

  const total = users.length;
  const active = users.filter((u) => u.status === "active").length;
  const inactive = users.filter((u) => u.status === "inactive").length;

  return (
    <div className="umv-page">
      {/* Page Header */}
      <div className="umv-page-header">
        <h1 className="umv-page-title">User Management</h1>
        <p className="umv-page-subtitle">
          Manage users in your role-based access control system
        </p>
      </div>

      {/* Stat Cards */}
      <div className="umv-stats-row">
        <div className="umv-stat-card">
          <ShineBorder />
          <span className="umv-stat-label">Total Users</span>
          <span className="umv-stat-value">{total}</span>
        </div>
        <div className="umv-stat-card">
          <ShineBorder shineColor={["#22c55e", "#4ade80"]} />
          <span className="umv-stat-label">Active Status</span>
          <span className="umv-stat-value umv-val-green">{active}</span>
        </div>
        <div className="umv-stat-card">
          <ShineBorder shineColor={["#f97316", "#fb923c"]} />
          <span className="umv-stat-label">Inactive Status</span>
          <span className="umv-stat-value umv-val-orange">{inactive}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="umv-tabs">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`umv-tab ${activeTab === t.key ? "umv-tab-active" : ""}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Add Button */}
      <div className="umv-actions-bar">
        <button className="umv-add-btn" onClick={() => setShowModal(true)}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M7 1v12M1 7h12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          Add User
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "users" && (
        <UserList
          users={users}
          search={search}
          onSearchChange={setSearch}
          onEdit={(u: User) => console.log("Edit", u)}
          onDelete={(id: string) => console.log("Delete", id)}
        />
      )}

      {activeTab === "assignments" && (
        <div className="umv-placeholder-card">
          User Assignments content coming soon...
        </div>
      )}

      {activeTab === "roles" && (
        <div className="umv-placeholder-card">
          User Roles content coming soon...
        </div>
      )}

      {activeTab === "access" && (
        <div className="umv-placeholder-card">
          Role Module Access content coming soon...
        </div>
      )}

      {/* Dialog Component */}
      <UserDialog
        open={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleCreate}
        name={formName}
        onNameChange={setFormName}
        email={formEmail}
        onEmailChange={setFormEmail}
      />
    </div>
  );
};

export default UserManagement;
