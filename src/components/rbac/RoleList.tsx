import "./RoleList.css";

interface Role {
  id: string;
  description: string;
  status: "active" | "inactive";
  createdAt: string;
}

interface RoleListProps {
  roles: Role[];
  search: string;
  onSearchChange: (value: string) => void;
  onEdit?: (role: Role) => void;
  onDelete?: (id: string) => void;
}

const RoleList = ({
  roles,
  search,
  onSearchChange,
  onEdit,
  onDelete,
}: RoleListProps) => {
  const filtered = roles.filter(
    (r) =>
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="rl-table-card">
      <div className="rl-card-header">
        <h2 className="rl-card-title">
          <svg
            className="rl-title-icon"
            width="20"
            height="20"
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
        </h2>
      </div>

      <div className="rl-search-row">
        <div className="rl-search-wrap">
          <svg
            className="rl-search-icon"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
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
            className="rl-search-input"
            placeholder="Search roles..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="rl-table-wrap">
        <table className="rl-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Description</th>
              <th>Status</th>
              <th>Created At</th>
              <th className="rl-th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="rl-empty-cell">
                  No roles found.
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id} className="rl-tr">
                  <td className="rl-td-id">{r.id}</td>
                  <td>{r.description}</td>
                  <td>
                    <span
                      className={`rl-status-badge ${r.status === "active" ? "rl-badge-active" : "rl-badge-inactive"}`}
                    >
                      {r.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>{r.createdAt}</td>
                  <td className="rl-td-actions">
                    <button
                      className="rl-icon-btn"
                      title="Edit"
                      onClick={() => onEdit?.(r)}
                    >
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
                    <button
                      className="rl-icon-btn"
                      title="Delete"
                      onClick={() => onDelete?.(r.id)}
                    >
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
  );
};

export default RoleList;
