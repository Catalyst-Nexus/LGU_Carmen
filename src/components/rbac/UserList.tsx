import "./UserList.css";

interface User {
  id: string;
  name: string;
  email: string;
  status: "active" | "inactive";
  registeredAt: string;
}

interface UserListProps {
  users: User[];
  search: string;
  onSearchChange: (value: string) => void;
  onEdit?: (user: User) => void;
  onDelete?: (id: string) => void;
}

const UserList = ({
  users,
  search,
  onSearchChange,
  onEdit,
  onDelete,
}: UserListProps) => {
  const filtered = users.filter(
    (u) =>
      u.id.toLowerCase().includes(search.toLowerCase()) ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="ul-table-card">
      <div className="ul-card-header">
        <h2 className="ul-card-title">User Management</h2>
      </div>

      <div className="ul-search-row">
        <div className="ul-search-wrap">
          <svg
            className="ul-search-icon"
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
            className="ul-search-input"
            placeholder="Search users..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="ul-table-wrap">
        <table className="ul-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
              <th>Registered At</th>
              <th className="ul-th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="ul-empty-cell">
                  No users found.
                </td>
              </tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.id} className="ul-tr">
                  <td className="ul-td-id">{u.id}</td>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <span
                      className={`ul-status-badge ${u.status === "active" ? "ul-badge-active" : "ul-badge-inactive"}`}
                    >
                      {u.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>{u.registeredAt}</td>
                  <td className="ul-td-actions">
                    <button
                      className="ul-icon-btn"
                      title="Edit"
                      onClick={() => onEdit?.(u)}
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
                      className="ul-icon-btn"
                      title="Delete"
                      onClick={() => onDelete?.(u.id)}
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

export default UserList;
