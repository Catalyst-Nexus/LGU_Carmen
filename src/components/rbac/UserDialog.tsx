import "./UserDialog.css";

interface UserDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  name: string;
  onNameChange: (value: string) => void;
  email: string;
  onEmailChange: (value: string) => void;
}

const UserDialog = ({
  open,
  onClose,
  onSubmit,
  name,
  onNameChange,
  email,
  onEmailChange,
}: UserDialogProps) => {
  if (!open) return null;

  return (
    <div className="ud-overlay" onClick={onClose}>
      <div className="ud-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ud-header">
          <h3 className="ud-title">Add User</h3>
          <button className="ud-close-btn" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="ud-body">
          <div className="ud-form-group">
            <label className="ud-label">Name</label>
            <input
              type="text"
              className="ud-input"
              placeholder="Enter user name..."
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
            />
          </div>
          <div className="ud-form-group">
            <label className="ud-label">Email</label>
            <input
              type="email"
              className="ud-input"
              placeholder="Enter user email..."
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
            />
          </div>
        </div>

        <div className="ud-footer">
          <button className="ud-btn ud-btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="ud-btn ud-btn-create" onClick={onSubmit}>
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDialog;
