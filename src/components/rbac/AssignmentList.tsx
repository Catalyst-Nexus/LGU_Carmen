import "./AssignmentList.css";

interface Assignment {
  id: string;
  description: string;
  status: "active" | "inactive";
  createdAt: string;
}

interface AssignmentListProps {
  assignments: Assignment[];
  search: string;
  onSearchChange: (value: string) => void;
  onEdit?: (assignment: Assignment) => void;
  onDelete?: (id: string) => void;
}

const AssignmentList = ({
  assignments,
  search,
  onSearchChange,
  onEdit,
  onDelete,
}: AssignmentListProps) => {
  const filtered = assignments.filter(
    (a) =>
      a.id.toLowerCase().includes(search.toLowerCase()) ||
      a.description.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="al-table-card">
      <div className="al-card-header">
        <h2 className="al-card-title">Assignment Management</h2>
      </div>

      <div className="al-search-row">
        <div className="al-search-wrap">
          <svg
            className="al-search-icon"
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
            className="al-search-input"
            placeholder="Search assignments..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="al-table-wrap">
        <table className="al-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Description</th>
              <th>Status</th>
              <th>Created At</th>
              <th className="al-th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="al-empty-cell">
                  No assignments found.
                </td>
              </tr>
            ) : (
              filtered.map((a) => (
                <tr key={a.id} className="al-tr">
                  <td className="al-td-id">{a.id}</td>
                  <td>{a.description}</td>
                  <td>
                    <span
                      className={`al-status-badge ${a.status === "active" ? "al-badge-active" : "al-badge-inactive"}`}
                    >
                      {a.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>{a.createdAt}</td>
                  <td className="al-td-actions">
                    <button
                      className="al-icon-btn"
                      title="Edit"
                      onClick={() => onEdit?.(a)}
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
                      className="al-icon-btn"
                      title="Delete"
                      onClick={() => onDelete?.(a.id)}
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

export default AssignmentList;
