import "./ModuleList.css";

interface Module {
  id: string;
  description: string;
  status: "active" | "inactive";
  createdAt: string;
}

interface ModuleListProps {
  modules: Module[];
  search: string;
  onSearchChange: (value: string) => void;
  onEdit?: (module: Module) => void;
  onDelete?: (id: string) => void;
}

const ModuleList = ({
  modules,
  search,
  onSearchChange,
  onEdit,
  onDelete,
}: ModuleListProps) => {
  const filtered = modules.filter(
    (m) =>
      m.id.toLowerCase().includes(search.toLowerCase()) ||
      m.description.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="ml-table-card">
      <div className="ml-card-header">
        <h2 className="ml-card-title">Module Management</h2>
      </div>

      <div className="ml-search-row">
        <div className="ml-search-wrap">
          <svg
            className="ml-search-icon"
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
            className="ml-search-input"
            placeholder="Search modules..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="ml-table-wrap">
        <table className="ml-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Description</th>
              <th>Status</th>
              <th>Created At</th>
              <th className="ml-th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="ml-empty-cell">
                  No modules found.
                </td>
              </tr>
            ) : (
              filtered.map((m) => (
                <tr key={m.id} className="ml-tr">
                  <td className="ml-td-id">{m.id}</td>
                  <td>{m.description}</td>
                  <td>
                    <span
                      className={`ml-status-badge ${m.status === "active" ? "ml-badge-active" : "ml-badge-inactive"}`}
                    >
                      {m.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>{m.createdAt}</td>
                  <td className="ml-td-actions">
                    <button
                      className="ml-icon-btn"
                      title="Edit"
                      onClick={() => onEdit?.(m)}
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
                      className="ml-icon-btn"
                      title="Delete"
                      onClick={() => onDelete?.(m.id)}
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

export default ModuleList;
